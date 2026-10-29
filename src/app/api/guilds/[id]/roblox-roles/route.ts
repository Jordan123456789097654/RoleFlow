import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { getRobloxGroupRoles } from "@/lib/roblox";

export const dynamic = "force-dynamic";

/**
 * Roles of a Roblox group, for the "choose roles to monitor" popup.
 * monitored is the saved selection, returned only when groupId matches the saved group.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const groupId = new URL(req.url).searchParams.get("groupId") ?? "";
  if (!/^\d{1,20}$/.test(groupId)) return NextResponse.json({ error: "Enter a numeric group ID." }, { status: 400 });

  const roles = await getRobloxGroupRoles(groupId);
  if (roles.length === 0) return NextResponse.json({ error: "Group not found, or its roles could not be loaded." }, { status: 404 });

  const guild = await prisma.guild.findUnique({
    where: { id: params.id },
    select: { robloxGroupId: true, staffMonitoredRanks: true },
  });
  const monitored = guild?.robloxGroupId === groupId ? guild.staffMonitoredRanks : [];

  return NextResponse.json({
    roles: roles.filter((r) => r.rank > 0).map((r) => ({ rank: r.rank, name: r.name })),
    monitored,
  });
}
