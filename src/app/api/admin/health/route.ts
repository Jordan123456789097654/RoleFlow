import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** Recent operational events and per-source error counts for the last 24 hours. */
export async function GET() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  if (!me || !isSiteAdminUser(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - 86_400_000);
  const [recent, last24h, lastInteraction] = await Promise.all([
    prisma.systemEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.systemEvent.groupBy({ by: ["source", "level"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.systemEvent.findFirst({ where: { source: "interactions" }, orderBy: { createdAt: "desc" } }),
  ]);

  const interactionsStale = !lastInteraction || Date.now() - lastInteraction.createdAt.getTime() > 3_600_000 * 24;
  return NextResponse.json({
    recent,
    counts24h: last24h.map((r) => ({ source: r.source, level: r.level, count: r._count._all })),
    interactions: {
      lastSeenAt: lastInteraction?.createdAt ?? null,
      status: interactionsStale ? "NO_RECENT_HEARTBEAT" : "OK",
    },
  });
}
