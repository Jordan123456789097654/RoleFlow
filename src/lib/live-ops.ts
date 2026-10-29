import { prisma } from "./prisma";

export const LIVE_SERVER_MS = 3 * 60_000; // a server is live if it reported within 3 minutes
export const BROADCAST_COOLDOWN_MS = 10 * 60_000;
export const BROADCAST_VISIBLE_MS = 5 * 60_000;

/** Plain text only. Control characters are removed and whitespace collapsed. */
export function sanitizeBroadcast(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length >= 1 && cleaned.length <= 200 ? cleaned : null;
}

export async function getLiveServers(guildId: string, now = new Date()) {
  const servers = await prisma.gameServer.findMany({
    where: { guildId, lastSeenAt: { gte: new Date(now.getTime() - LIVE_SERVER_MS) } },
    orderBy: { startedAt: "asc" },
    select: { serverJobId: true, placeId: true, playerCount: true, maxPlayers: true, averagePingMs: true, startedAt: true },
  });
  if (servers.length === 0) return [];

  const [staff, shifts] = await Promise.all([
    prisma.guildStaff.findMany({
      where: { guildId, robloxUserId: { not: null } },
      select: { robloxUserId: true, username: true },
    }),
    prisma.shift.findMany({
      where: { guildId, status: "ACTIVE", serverJobId: { in: servers.map((s) => s.serverJobId) } },
      select: { serverJobId: true, robloxUserId: true },
    }),
  ]);
  const nameByRoblox = new Map(staff.map((s) => [s.robloxUserId!, s.username ?? "Unknown staff"]));

  return servers.map((s) => ({
    ...s,
    staffOnline: shifts
      .filter((sh) => sh.serverJobId === s.serverJobId)
      .map((sh) => nameByRoblox.get(sh.robloxUserId) ?? "Unlinked account"),
  }));
}

export async function getRecentBroadcasts(guildId: string) {
  return prisma.broadcast.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, message: true, createdAt: true, _count: { select: { receipts: true } } },
  });
}
