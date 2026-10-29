import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

/**
 * Per-position funnel: totals, acceptance rate, and median time to decision.
 * Decision time uses updatedAt, so it is an estimate (later edits can shift it).
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;

  const positions = await prisma.position.findMany({
    where: { guildId: params.id },
    select: {
      id: true,
      title: true,
      applications: { select: { status: true, createdAt: true, updatedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = positions.map((p) => {
    const apps = p.applications;
    const accepted = apps.filter((a) => a.status === "ACCEPTED").length;
    const rejected = apps.filter((a) => a.status === "REJECTED").length;
    const decided = accepted + rejected;

    const hours = apps
      .filter((a) => a.status === "ACCEPTED" || a.status === "REJECTED")
      .map((a) => (a.updatedAt.getTime() - a.createdAt.getTime()) / 3_600_000)
      .sort((x, y) => x - y);

    let median: number | null = null;
    if (hours.length) {
      const mid = Math.floor(hours.length / 2);
      median = hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
    }

    return {
      positionId: p.id,
      title: p.title,
      total: apps.length,
      pending: apps.length - decided,
      accepted,
      rejected,
      acceptanceRate: decided ? Math.round((accepted / decided) * 100) : null,
      medianHoursToDecision: median === null ? null : Math.round(median * 10) / 10,
    };
  });

  return NextResponse.json({ positions: rows });
}
