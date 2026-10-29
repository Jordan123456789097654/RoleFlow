import { prisma } from "./prisma";

/** A shift with no heartbeat for this long is closed at its last heartbeat (no ghost hours). */
export const HEARTBEAT_TIMEOUT_MS = 3 * 60 * 1000;

export type WeekWindow = { start: Date; end: Date };

/** Rolling week starting at 00:00 UTC on `startDay` (0 = Sunday ... 6 = Saturday). */
export function currentWeekWindow(now: Date, startDay = 1): WeekWindow {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const back = (day.getUTCDay() - startDay + 7) % 7;
  const start = new Date(day.getTime() - back * 86_400_000);
  return { start, end: new Date(start.getTime() + 7 * 86_400_000) };
}

type ShiftLike = { startedAt: Date; lastHeartbeatAt: Date; endedAt: Date | null };

/** When a shift effectively stopped counting: its end, its last heartbeat if timed out, or now. */
export function effectiveEnd(shift: ShiftLike, now: Date): Date {
  if (shift.endedAt) return shift.endedAt;
  if (now.getTime() - shift.lastHeartbeatAt.getTime() > HEARTBEAT_TIMEOUT_MS) return shift.lastHeartbeatAt;
  return now;
}

/** Minutes a shift contributed inside the window, clipped to the window's edges. */
export function shiftMinutesInWindow(shift: ShiftLike, window: WeekWindow, now: Date): number {
  const from = Math.max(shift.startedAt.getTime(), window.start.getTime());
  const to = Math.min(effectiveEnd(shift, now).getTime(), window.end.getTime(), now.getTime());
  return Math.max(0, Math.round((to - from) / 60_000));
}

export function quotaPercent(minutes: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.floor((minutes / target) * 100));
}

/** Matches the progress gauge: orange 0-49, yellow 50-99, green 100 (quota met). */
export function progressTone(percent: number): "orange" | "yellow" | "green" {
  if (percent >= 100) return "green";
  if (percent >= 50) return "yellow";
  return "orange";
}

export type RosterMember = {
  userId: string;
  username: string;
  robloxUserId: string | null;
  robloxRankId: number | null;
  rankName: string | null;
  quotaMinutes: number | null;
  minutes: number;
  percent: number | null;
  tone: "orange" | "yellow" | "green" | null;
};

export async function buildRoster(guildId: string, now = new Date()) {
  const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { robloxGroupId: true, staffMonitoredRanks: true } });
  const window = currentWeekWindow(now);

  const [rules, staff, shifts] = await Promise.all([
    prisma.quotaRule.findMany({ where: { guildId } }),
    prisma.guildStaff.findMany({
      where: { guildId },
      select: { userId: true, username: true, robloxUserId: true, robloxRankId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shift.findMany({
      where: { guildId, startedAt: { lt: window.end }, OR: [{ endedAt: null }, { endedAt: { gte: window.start } }] },
      select: { robloxUserId: true, startedAt: true, lastHeartbeatAt: true, endedAt: true },
    }),
  ]);

  const ruleByRank = new Map(rules.map((r) => [r.robloxRankId, r]));
  const minutesByRobloxId = new Map<string, number>();
  for (const s of shifts) {
    minutesByRobloxId.set(s.robloxUserId, (minutesByRobloxId.get(s.robloxUserId) ?? 0) + shiftMinutesInWindow(s, window, now));
  }

  const monitored = new Set(guild?.staffMonitoredRanks ?? []);
  const visibleStaff = monitored.size
    ? staff.filter((s) => s.robloxRankId != null && (s.robloxRankId === 0 || monitored.has(s.robloxRankId)))
    : staff;
  const members: RosterMember[] = visibleStaff.map((s) => {
    const rule = s.robloxRankId != null ? ruleByRank.get(s.robloxRankId) : undefined;
    const minutes = s.robloxUserId ? minutesByRobloxId.get(s.robloxUserId) ?? 0 : 0;
    const percent = rule ? quotaPercent(minutes, rule.weeklyMinutes) : null;
    return {
      userId: s.userId,
      username: s.username ?? "Unknown staff",
      robloxUserId: s.robloxUserId,
      robloxRankId: s.robloxRankId,
      rankName: rule?.rankName ?? null,
      quotaMinutes: rule?.weeklyMinutes ?? null,
      minutes,
      percent,
      tone: percent == null ? null : progressTone(percent),
    };
  });

  return {
    linked: Boolean(guild?.robloxGroupId),
    monitoredRanks: guild?.staffMonitoredRanks ?? [],
    robloxGroupId: guild?.robloxGroupId ?? null,
    week: { start: window.start.toISOString(), end: window.end.toISOString() },
    rules: rules.map((r) => ({ robloxRankId: r.robloxRankId, rankName: r.rankName, weeklyMinutes: r.weeklyMinutes })),
    members,
  };
}
