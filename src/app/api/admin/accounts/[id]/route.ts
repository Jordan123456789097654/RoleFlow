import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  return me && isSiteAdminUser(me) ? me : null;
}

/** Everything about one account, in one place. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, username: true, email: true, avatar: true, robloxUsername: true, siteRole: true, isSiteAdmin: true, isSupportStaff: true, isBanned: true, plan: true, createdAt: true, sessionVersion: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [guilds, applications, auditEntries, devices, punishments] = await Promise.all([
    prisma.guild.findMany({ where: { ownerId: params.id }, select: { id: true, name: true, isPaused: true, createdAt: true } }),
    prisma.application.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, createdAt: true, position: { select: { title: true, guild: { select: { name: true } } } } },
    }),
    prisma.auditLog.findMany({ where: { OR: [{ actorId: params.id }, { targetId: params.id }] }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.loginDevice.findMany({ where: { userId: params.id }, orderBy: { lastSeenAt: "desc" }, take: 20 }),
    prisma.punishment.findMany({ where: { targetType: "USER", targetId: params.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({ user, guilds, applications, auditEntries, devices, punishments });
}

/** Revoke every active session for this account (sessions are tied to a session version). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { siteRole: true, id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.siteRole === "FOUNDER" && me.id !== target.id) {
    return NextResponse.json({ error: "The founder's sessions cannot be revoked by others." }, { status: 403 });
  }
  await prisma.user.update({ where: { id: params.id }, data: { sessionVersion: { increment: 1 } } });
  await recordAudit({ actorId: me.id, action: "SESSIONS_REVOKED", targetId: params.id });
  return NextResponse.json({ success: true });
}
