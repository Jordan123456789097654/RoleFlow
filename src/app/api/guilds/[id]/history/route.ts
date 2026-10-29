import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

/** Recent position changes in this community: created, duplicated, and edited. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;

  const positions = await prisma.position.findMany({ where: { guildId: params.id }, select: { id: true, title: true } });
  const titles = new Map(positions.map((p) => [p.id, p.title]));

  const logs = await prisma.auditLog.findMany({
    where: {
      action: { startsWith: "POSITION_" },
      targetId: { in: [params.id, ...titles.keys()] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, username: true } });
  const names = new Map(actors.map((a) => [a.id, a.username]));

  return NextResponse.json({
    entries: logs.map((l) => {
      let details: any = {};
      try { details = l.details ? JSON.parse(l.details) : {}; } catch { details = {}; }
      return {
        id: l.id,
        action: l.action,
        createdAt: l.createdAt,
        actor: names.get(l.actorId) ?? "Unknown",
        position: titles.get(l.targetId ?? "") ?? details.title ?? "Position",
      };
    }),
  });
}
