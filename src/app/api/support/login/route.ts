import { isFounderId } from "@/lib/roles";
import { sendSecurityNoticeEmail } from "@/lib/email";
import { recordAudit } from "@/lib/audit";
import { signSessionValue } from "@/lib/session";
import { setSessionCookie } from "@/lib/session-cookie";
import { verifySessionValue } from "@/lib/session";
import { findActiveBan } from "@/lib/bans";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const callerId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!callerId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in with your Support Staff Discord account first." },
        { status: 401 }
      );
    }

    const caller = await prisma.user.findUnique({ where: { id: callerId } });
    const isStaff = caller?.isSupportStaff || caller?.isSiteAdmin || isFounderId(caller?.id);

    if (!isStaff) {
      return NextResponse.json(
        { error: "Access denied. Only authorized RoleFlow Support Staff can initiate diagnostic sessions." },
        { status: 403 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Please provide a valid support access code." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const now = new Date();

    // Find the user whose support code matches and has not expired
    const targetUser = await prisma.user.findFirst({
      where: {
        supportCode: cleanCode,
        supportCodeExpiresAt: {
          gt: now,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Invalid or expired support access code. Codes expire after 10 minutes." },
        { status: 401 }
      );
    }

    // A banned or suspended account must not get a fresh session, even through a support code.
    const ban = await findActiveBan({
      discordId: targetUser.id,
      robloxId: targetUser.robloxId,
      robloxUsername: targetUser.robloxUsername,
    });
    if (ban || targetUser.isBanned) {
      return NextResponse.json(
        { error: "This account is banned or suspended, so a support session cannot be opened." },
        { status: 403 }
      );
    }

    // One-time use: burn the code so it cannot be replayed.
    await prisma.user.update({ where: { id: targetUser.id }, data: { supportCode: null, supportCodeExpiresAt: null } });

    // Security notice: always sent when an address exists.
    if (targetUser.email) {
      sendSecurityNoticeEmail({
        toEmail: targetUser.email,
        username: targetUser.username,
        heading: "Support staff opened a diagnostic session",
        message: "A RoleFlow support staff member opened a temporary diagnostic session on your account. If you didn't request support, contact us.",
      }).catch((e) => console.error("Support notice email failed:", e));
    }
    await recordAudit({ actorId: callerId, action: "SUPPORT_SESSION_START", targetId: targetUser.id });

    // Calculate remaining seconds
    const remainingMs = targetUser.supportCodeExpiresAt
      ? targetUser.supportCodeExpiresAt.getTime() - now.getTime()
      : 600000;
    const remainingSeconds = Math.max(Math.floor(remainingMs / 1000), 60);

    // Create session response logging support staff in as the target member
    const response = NextResponse.json({
      success: true,
      message: `Diagnostic session established for member ${targetUser.username}`,
      targetUser: {
        id: targetUser.id,
        username: targetUser.username,
        avatar: targetUser.avatar,
      },
      expiresInSeconds: remainingSeconds,
    });

    // Set cookie valid for the remainder of the 10-minute code
    setSessionCookie(response, signSessionValue(targetUser.id, targetUser.sessionVersion), remainingSeconds);

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
