import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupportCaller } from "@/lib/staff-access";

export const dynamic = "force-dynamic";

/** Everything support needs to see about one account. Secrets are never returned. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, username: true, discriminator: true, avatar: true, email: true, emailNotifications: true,
      companyEmail: true, robloxId: true, robloxUsername: true, siteRole: true, isSiteAdmin: true,
      isSupportStaff: true, isBanned: true, plan: true, planExpiresAt: true, createdAt: true, totpEnabled: true,
      savedProfile: true, sessionVersion: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [applications, devices, punishments, ownedGuilds, auditEntries, removals, reports] = await Promise.all([
    prisma.application.findMany({
      where: { userId: params.id }, orderBy: { createdAt: "desc" }, take: 20,
      select: { id: true, status: true, createdAt: true, position: { select: { title: true, guild: { select: { name: true } } } } },
    }),
    prisma.loginDevice.findMany({ where: { userId: params.id }, orderBy: { lastSeenAt: "desc" }, take: 10, select: { id: true, createdAt: true, lastSeenAt: true } }),
    prisma.punishment.findMany({ where: { targetType: "USER", targetId: params.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.guild.findMany({ where: { ownerId: params.id }, select: { id: true, name: true, isPaused: true } }),
    prisma.auditLog.findMany({ where: { OR: [{ targetId: params.id }, { actorId: params.id }] }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.dataRemovalLog.findMany({ where: { subjectUserId: params.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.supportReport.findMany({
      where: { OR: [{ subjectUserId: params.id }, { subjectUsername: user.username }] },
      orderBy: { createdAt: "desc" }, take: 20,
    }),
  ]);

  return NextResponse.json({
    user: { ...user, savedProfile: undefined, hasSavedProfile: Boolean(user.savedProfile) },
    applications, devices, punishments, ownedGuilds, auditEntries, removals, reports,
  });
}
