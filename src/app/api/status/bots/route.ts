import { prisma } from "@/lib/prisma";
import { statusJson, statusOptions } from "@/lib/status-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FRESH_MS = 3 * 60_000; // the daemon checks in every minute

export async function OPTIONS() {
  return statusOptions();
}

/** Public: bot hosting health. Counts only, no community names or tokens. */
export async function GET() {
  const now = Date.now();
  const fresh = new Date(now - FRESH_MS);
  const dayAgo = new Date(now - 24 * 60 * 60_000);

  const [configured, online, error, lastBeat, pending, failedLastDay, oldestPending] = await Promise.all([
    prisma.guild.count({ where: { useCustomBot: true, customBotToken: { not: null } } }),
    prisma.guild.count({ where: { useCustomBot: true, botLiveStatus: "ONLINE", botLiveStatusAt: { gte: fresh } } }),
    prisma.guild.count({ where: { useCustomBot: true, botLiveStatus: "ERROR", botLiveStatusAt: { gte: fresh } } }),
    prisma.guild.findFirst({ where: { botLiveStatusAt: { not: null } }, orderBy: { botLiveStatusAt: "desc" }, select: { botLiveStatusAt: true } }),
    prisma.botOutbox.count({ where: { status: "PENDING" } }),
    prisma.botOutbox.count({ where: { status: "FAILED", createdAt: { gte: dayAgo } } }),
    prisma.botOutbox.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);

  const daemonCheckedIn = Boolean(lastBeat?.botLiveStatusAt && lastBeat.botLiveStatusAt.getTime() > now - FRESH_MS);
  const daemon = configured === 0 ? "NO_BOTS" : daemonCheckedIn ? "UP" : "DOWN";

  return statusJson({
    updatedAt: new Date(now).toISOString(),
    daemon: { status: daemon, lastCheckInAt: lastBeat?.botLiveStatusAt ?? null },
    bots: {
      configured,
      online,
      error,
      offline: Math.max(0, configured - online - error),
    },
    delivery: {
      pending,
      failedLast24h: failedLastDay,
      oldestPendingAt: oldestPending?.createdAt ?? null,
    },
  });
}
