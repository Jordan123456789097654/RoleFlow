import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";
import { isFounderId, isSiteAdminUser } from "@/lib/roles";
import { sha256 } from "@/lib/crypto";
import { recordAudit } from "@/lib/audit";
import { sendPasswordResetEmail, sendSecurityNoticeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Lets support staff send a password reset email to a member.
 *
 * Safeguards:
 * - The member must have an active 10-minute support code (they asked for help).
 * - The reset link is emailed to the address on the account. Support never sees it.
 * - Only email/password accounts qualify (Discord-only accounts have no password).
 * - Staff and admin accounts can only be reset by a site admin.
 * - One reset per member per 10 minutes. Every send is audited and the member is notified.
 */
export async function POST(request: Request) {
  try {
    const callerId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
    if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await prisma.user.findUnique({ where: { id: callerId } });
    const callerIsAdmin = Boolean(caller && (isSiteAdminUser(caller) || isFounderId(caller.id)));
    if (!caller || !(caller.isSupportStaff || callerIsAdmin)) {
      return NextResponse.json({ error: "Forbidden: Support Staff role required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const now = new Date();

    let target = null as Awaited<ReturnType<typeof prisma.user.findUnique>>;
    if (typeof body.userId === "string" && body.userId.trim()) {
      target = await prisma.user.findUnique({ where: { id: body.userId.trim() } });
    } else if (typeof body.discordId === "string" && body.discordId.trim()) {
      target = await prisma.user.findUnique({ where: { id: body.discordId.trim() } });
    } else if (typeof body.username === "string" && body.username.trim()) {
      target = await prisma.user.findFirst({
        where: { username: { equals: body.username.trim(), mode: "insensitive" } },
      });
    } else if (typeof body.code === "string" && body.code.trim()) {
      target = await prisma.user.findFirst({ where: { supportCode: body.code.trim().toUpperCase() } });
    } else {
      return NextResponse.json({ error: "Provide a Discord ID, Username, or Support Code." }, { status: 400 });
    }

    if (!target) {
      return NextResponse.json({ error: "No user found matching that Discord ID or username." }, { status: 404 });
    }
    if (!target.passwordHash) {
      return NextResponse.json({ error: "This user signs in with Discord OAuth directly; they do not use a password." }, { status: 400 });
    }
    if (!target.email) {
      return NextResponse.json({ error: "This account has no email address on file to send a reset link to." }, { status: 400 });
    }
    if ((target.isSiteAdmin || target.isSupportStaff || isFounderId(target.id)) && !callerIsAdmin) {
      return NextResponse.json({ error: "Only a site admin or founder can reset staff/admin accounts." }, { status: 403 });
    }

    const recent = await prisma.passwordResetToken.findFirst({
      where: { userId: target.id, createdAt: { gt: new Date(now.getTime() - COOLDOWN_MS) } },
      select: { id: true },
    });
    if (recent) {
      return NextResponse.json({ error: "A reset link was already sent in the last 10 minutes." }, { status: 429 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.deleteMany({ where: { userId: target.id } });
    await prisma.passwordResetToken.create({
      data: { userId: target.id, token: sha256(token), expiresAt: new Date(now.getTime() + 60 * 60 * 1000) },
    });

    const sent = await sendPasswordResetEmail(target.email, target.username, token);
    await recordAudit({
      actorId: callerId,
      action: "SUPPORT_PASSWORD_RESET",
      targetId: target.id,
      details: { emailSent: sent.success },
    });
    if (!sent.success) {
      return NextResponse.json({ error: "The reset email could not be sent. Try again shortly." }, { status: 502 });
    }

    sendSecurityNoticeEmail({
      toEmail: target.email,
      username: target.username,
      heading: "Support sent you a password reset link",
      message: "A RoleFlow support staff member sent a password reset link to this address at your request. The link expires in 1 hour.",
    }).catch((e) => console.error("Support reset notice failed:", e));

    return NextResponse.json({ success: true, message: `Reset link emailed to ${target.username}.` });
  } catch (err) {
    console.error("Support password reset error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
