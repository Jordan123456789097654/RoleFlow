import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

const WEEKS = 12;
const WEEK_MS = 7 * 86_400_000;

function weekBuckets(dates: Date[]) {
  const now = Date.now();
  const buckets = Array.from({ length: WEEKS }, (_, i) => {
    const end = now - (WEEKS - 1 - i) * WEEK_MS;
    return { weekStart: new Date(end - WEEK_MS).toISOString().slice(0, 10), count: 0, _end: end, _start: end - WEEK_MS };
  });
  for (const d of dates) {
    const t = d.getTime();
    const b = buckets.find((x) => t > x._start && t <= x._end);
    if (b) b.count++;
  }
  return buckets.map(({ _end, _start, ...rest }) => rest);
}

/** Growth and outcome metrics for the admin dashboard. */
export async function GET() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  if (!me || !isSiteAdminUser(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = new Date(Date.now() - WEEKS * WEEK_MS);
  const [guilds, apps, outcomes30d, outcomesAll] = await Promise.all([
    prisma.guild.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.application.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.application.groupBy({ by: ["status"], where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) }, status: { in: ["ACCEPTED", "REJECTED"] } }, _count: { _all: true } }),
    prisma.application.groupBy({ by: ["status"], where: { status: { in: ["ACCEPTED", "REJECTED"] } }, _count: { _all: true } }),
  ]);

  const rate = (rows: { status: string; _count: { _all: number } }[]) => {
    const acc = rows.find((r) => r.status === "ACCEPTED")?._count._all ?? 0;
    const rej = rows.find((r) => r.status === "REJECTED")?._count._all ?? 0;
    return acc + rej === 0 ? null : Math.round((acc / (acc + rej)) * 1000) / 10;
  };

  return NextResponse.json({
    communitiesPerWeek: weekBuckets(guilds.map((g) => g.createdAt)),
    applicationsPerWeek: weekBuckets(apps.map((a) => a.createdAt)),
    acceptanceRate30d: rate(outcomes30d),
    acceptanceRateAllTime: rate(outcomesAll),
  });
}
