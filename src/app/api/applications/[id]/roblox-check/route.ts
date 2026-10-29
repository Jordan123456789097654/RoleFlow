import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { getRobloxUserProfile, getUserGroupRole } from "@/lib/roblox";

export const dynamic = "force-dynamic";

/** Roblox facts staff need during review: account age and standing in the community's group. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.application.findUnique({
    where: { id: params.id },
    select: {
      user: { select: { robloxId: true, robloxUsername: true } },
      position: { select: { guildId: true } },
    },
  });
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const access = await authorizeGuild(app.position.guildId, "view");
  if (!access.ok) return access.response;

  if (!app.user.robloxId) {
    return NextResponse.json({ linked: false, username: app.user.robloxUsername ?? null });
  }

  const guild = await prisma.guild.findUnique({
    where: { id: app.position.guildId },
    select: { robloxGroupId: true },
  });

  const [profile, group] = await Promise.all([
    getRobloxUserProfile(app.user.robloxId),
    guild?.robloxGroupId ? getUserGroupRole(app.user.robloxId, guild.robloxGroupId) : Promise.resolve(null),
  ]);

  const accountAgeDays = profile?.created
    ? Math.floor((Date.now() - new Date(profile.created).getTime()) / 86_400_000)
    : null;

  return NextResponse.json({
    linked: true,
    username: profile?.name ?? app.user.robloxUsername ?? null,
    accountAgeDays,
    group: group ? { ...group, groupId: guild?.robloxGroupId ?? null } : null,
  });
}
