import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";
import { sendSecurityNoticeEmail } from "@/lib/email";
import { applyGuildAction } from "@/lib/punishments";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  return me && isSiteAdminUser(me) ? me : null;
}

/** Pending appeals, oldest first. */
export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const appeals = await prisma.punishment.findMany({
    where: { appealStatus: "PENDING" },
    orderBy: { appealedAt: "asc" },
    take: 200,
  });

  const userIds = appeals.filter((a) => a.targetType === "USER").map((a) => a.targetId);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } });
  const names = Object.fromEntries(users.map((u) => [u.id, u.username]));

  return NextResponse.json(
    appeals.map((a) => ({ ...a, targetName: a.targetType === "USER" ? names[a.targetId] ?? a.targetId : a.targetId }))
  );
}

/** Approve (lifts the punishment) or deny an appeal. */
export async function POST(request: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { punishmentId, decision, note } = await request.json();
  if (!["APPROVE", "DENY"].includes(decision)) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

  const punishment = await prisma.punishment.findUnique({ where: { id: String(punishmentId) } });
  if (!punishment || punishment.appealStatus !== "PENDING") {
    return NextResponse.json({ error: "No pending appeal for this punishment." }, { status: 404 });
  }

  const approved = decision === "APPROVE";
  if (approved) {
    if (punishment.targetType === "USER") {
      await prisma.punishment.update({ where: { id: punishment.id }, data: { liftedAt: new Date() } });
    } else {
      await applyGuildAction({ guildId: punishment.targetId, action: "UNPAUSE", issuedById: me.id, reason: "Appeal approved" });
    }
  }

  await prisma.punishment.update({
    where: { id: punishment.id },
    data: { appealStatus: approved ? "APPROVED" : "DENIED", decisionNote: note ? String(note).slice(0, 500) : null },
  });
  await recordAudit({ actorId: me.id, action: "APPEAL_DECIDE", targetId: punishment.targetId, details: { punishmentId: punishment.id, decision } });

  if (punishment.targetType === "USER") {
    const user = await prisma.user.findUnique({ where: { id: punishment.targetId }, select: { username: true, email: true, emailNotifications: true } });
    // Appeal decisions are account-safety notices, so they are not gated on the notifications setting.
    if (user?.email) {
      await sendSecurityNoticeEmail({
        toEmail: user.email,
        username: user.username,
        heading: approved ? "Your appeal was approved" : "Your appeal was denied",
        message: approved ? "The restriction on your account has been lifted." : `Your appeal was reviewed and denied.${note ? ` Note: ${note}` : ""}`,
      });
    }
  }
  return NextResponse.json({ success: true });
}
