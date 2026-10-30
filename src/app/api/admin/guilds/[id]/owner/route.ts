import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";
import { sendSecurityNoticeEmail } from "@/lib/email";
import { findActiveBan } from "@/lib/bans";

export const dynamic = "force-dynamic";

/** Site admins only: move a community to a new owner. Both owners get a notice; the reason is kept in the audit log. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  const me = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, isSiteAdmin: true, siteRole: true } }) : null;
  if (!me || !isSiteAdminUser(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const newOwnerId = String(body?.newOwnerId ?? "").trim();
  const reason = String(body?.reason ?? "").trim().slice(0, 1000);
  if (!newOwnerId) return NextResponse.json({ error: "Enter the new owner's Discord user ID." }, { status: 400 });
  if (reason.length < 10) return NextResponse.json({ error: "Give a reason of at least 10 characters. It is kept in the audit log." }, { status: 400 });

  const guild = await prisma.guild.findUnique({ where: { id: params.id }, select: { id: true, name: true, ownerId: true } });
  if (!guild) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  if (newOwnerId === guild.ownerId) return NextResponse.json({ error: "That user already owns this community." }, { status: 400 });

  const [oldOwner, newOwner] = await Promise.all([
    prisma.user.findUnique({ where: { id: guild.ownerId }, select: { id: true, username: true, email: true } }),
    prisma.user.findUnique({ where: { id: newOwnerId }, select: { id: true, username: true, email: true, isBanned: true, robloxId: true, robloxUsername: true } }),
  ]);
  if (!newOwner) return NextResponse.json({ error: "No account has that Discord user ID." }, { status: 404 });
  const ban = await findActiveBan({ discordId: newOwner.id, robloxId: newOwner.robloxId, robloxUsername: newOwner.robloxUsername });
  if (ban || newOwner.isBanned) return NextResponse.json({ error: "That account is banned or suspended and cannot own a community." }, { status: 403 });

  await prisma.guild.update({ where: { id: guild.id }, data: { ownerId: newOwner.id } });

  if (oldOwner?.email) {
    sendSecurityNoticeEmail({ toEmail: oldOwner.email, username: oldOwner.username, heading: "Ownership of a community was transferred", message: `You are no longer the owner of "${guild.name}". Ownership moved to another account by a RoleFlow administrator. If you did not expect this, contact us.` })
      .catch((e) => console.error("Owner transfer notice failed:", e));
  }
  if (newOwner.email) {
    sendSecurityNoticeEmail({ toEmail: newOwner.email, username: newOwner.username, heading: "You now own a community on RoleFlow", message: `You are now the owner of "${guild.name}". Ownership was transferred to you by a RoleFlow administrator. If you did not expect this, contact us.` })
      .catch((e) => console.error("Owner transfer notice failed:", e));
  }

  await recordAudit({
    actorId: me.id,
    action: "GUILD_OWNER_TRANSFER",
    targetId: guild.id,
    details: { reason, fromOwnerId: guild.ownerId, toOwnerId: newOwner.id, guildName: guild.name },
  });
  return NextResponse.json({ success: true, newOwner: { id: newOwner.id, username: newOwner.username } });
}
