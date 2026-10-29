import { prisma } from "./prisma";
import { HEARTBEAT_TIMEOUT_MS } from "./staff-roster";

export const SHIFT_TYPES = ["STANDARD", "TRAINING", "EVENT", "PATROL"] as const;

export type GameEvent = {
  type: "join" | "heartbeat" | "leave";
  robloxUserId: string;
  serverJobId: string;
  placeId: string | null;
  shiftType: string;
};

/**
 * Closes shifts whose heartbeat went silent. The shift ends at its last heartbeat,
 * so a crash or disconnect never counts time nobody verified.
 */
export async function closeStaleShifts(guildId: string, now: Date, robloxUserId?: string): Promise<number> {
  const cutoff = new Date(now.getTime() - HEARTBEAT_TIMEOUT_MS);
  const stale = await prisma.shift.findMany({
    where: { guildId, status: "ACTIVE", lastHeartbeatAt: { lt: cutoff }, ...(robloxUserId ? { robloxUserId } : {}) },
    select: { id: true, lastHeartbeatAt: true },
  });
  for (const s of stale) {
    await prisma.shift.updateMany({
      where: { id: s.id, status: "ACTIVE" },
      data: { status: "TIMED_OUT", endedAt: s.lastHeartbeatAt },
    });
  }
  return stale.length;
}

/** Applies one join, heartbeat, or leave event from a game server. */
export async function ingestGameEvent(guildId: string, ev: GameEvent, now = new Date()) {
  await closeStaleShifts(guildId, now, ev.robloxUserId);

  const active = await prisma.shift.findFirst({
    where: { guildId, robloxUserId: ev.robloxUserId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
  });

  if (ev.type === "leave") {
    if (!active) return { action: "none" as const };
    if (active.serverJobId === ev.serverJobId) {
      await prisma.shift.update({ where: { id: active.id }, data: { status: "ENDED", endedAt: now, lastHeartbeatAt: now } });
    } else {
      // Left a different server than the one currently tracked: close that one at its last verified heartbeat.
      await prisma.shift.update({ where: { id: active.id }, data: { status: "ENDED", endedAt: active.lastHeartbeatAt } });
    }
    return { action: "ended" as const };
  }

  // join or heartbeat
  if (active && active.serverJobId === ev.serverJobId) {
    await prisma.shift.update({
      where: { id: active.id },
      data: { lastHeartbeatAt: now, placeId: ev.placeId ?? active.placeId },
    });
    return { action: "heartbeat" as const };
  }

  if (active) {
    // Moved servers without a leave event: end the old shift at its last verified heartbeat.
    await prisma.shift.update({ where: { id: active.id }, data: { status: "ENDED", endedAt: active.lastHeartbeatAt } });
  }

  // A heartbeat with no open shift (for example after a server restart) starts a fresh one from now.
  await prisma.shift.create({
    data: {
      guildId,
      robloxUserId: ev.robloxUserId,
      serverJobId: ev.serverJobId,
      placeId: ev.placeId,
      shiftType: ev.shiftType,
      startedAt: now,
      lastHeartbeatAt: now,
      status: "ACTIVE",
    },
  });
  return { action: ev.type === "join" ? ("started" as const) : ("resumed" as const) };
}
