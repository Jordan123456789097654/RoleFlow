import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type AntiNukeActionType = "DEMOTE" | "EXILE";

export interface RateCheckResult {
  allowed: boolean;
  isBreached: boolean;
  actionCountInWindow: number;
  maxAllowed: number;
  windowSeconds: number;
  reason?: string;
}

export interface AntiNukeEvent {
  groupId: string;
  executorId: string;
  actionType: AntiNukeActionType;
  timestamp: number;
}

// In-memory sliding-window store for rate checks
// Key: `${groupId}:${executorId}`
const actionWindowStore = new Map<string, AntiNukeEvent[]>();

// In-memory fallback lockdown store to maintain resilience when DB is not connected
const memoryLockdownStore = new Map<string, { status: "NORMAL" | "LOCKED"; lockedAt?: Date; lockedReason?: string }>();

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_DEMOTIONS_PER_MINUTE = 3;

/**
 * Checks sliding 60-second window rate for an executor.
 * If threshold is exceeded, triggers security lockdown and rejects action.
 */
export async function checkAntiNukeRate(
  groupId: string,
  executorId: string,
  actionType: AntiNukeActionType = "DEMOTE",
  customWindowSeconds: number = DEFAULT_WINDOW_SECONDS,
  customMaxActions?: number
): Promise<RateCheckResult> {
  const now = Date.now();
  const windowMs = customWindowSeconds * 1000;

  // Retrieve group security configuration if present
  let maxAllowed = customMaxActions ?? DEFAULT_MAX_DEMOTIONS_PER_MINUTE;
  let lockOnBreach = true;
  let antiNukeEnabled = true;

  // In-memory check first (fast-path and DB offline resilience)
  const memState = memoryLockdownStore.get(groupId);
  if (memState && memState.status === "LOCKED") {
    return {
      allowed: false,
      isBreached: true,
      actionCountInWindow: 0,
      maxAllowed,
      windowSeconds: customWindowSeconds,
      reason: `Group ranking operations are currently LOCKED. Reason: ${memState.lockedReason || "Security lockdown active"}`,
    };
  }

  try {
    const config = await prisma.rankHubSecurityConfig.findUnique({
      where: { groupId },
    });

    if (config) {
      if (!config.antiNukeEnabled) {
        return {
          allowed: true,
          isBreached: false,
          actionCountInWindow: 0,
          maxAllowed,
          windowSeconds: customWindowSeconds,
        };
      }

      if (config.status === "LOCKED") {
        return {
          allowed: false,
          isBreached: true,
          actionCountInWindow: 0,
          maxAllowed: config.maxDemotionsPerMinute,
          windowSeconds: customWindowSeconds,
          reason: `Group ranking operations are currently LOCKED. Reason: ${config.lockedReason || "Security lockdown active"}`,
        };
      }

      if (customMaxActions === undefined) {
        maxAllowed = config.maxDemotionsPerMinute;
      }
      lockOnBreach = config.lockOnBreach;
      antiNukeEnabled = config.antiNukeEnabled;
    }
  } catch {
    // If DB is offline / test mock, fallback to defaults and memory store
  }

  const key = `${groupId}:${executorId}`;
  const existingEvents = actionWindowStore.get(key) || [];

  // Filter out events outside the sliding window
  const activeEvents = existingEvents.filter((ev) => now - ev.timestamp <= windowMs);

  // Check if adding this action would breach the threshold
  if (activeEvents.length >= maxAllowed) {
    const breachReason = `Anti-Nuke Triggered: Executor ${executorId} attempted ${activeEvents.length + 1} ${actionType} actions within ${customWindowSeconds}s (Threshold: ${maxAllowed}/min).`;
    logger.warn(`Anti-nuke breach detected! Group: ${groupId}, Executor: ${executorId}`, {
      breachReason,
      eventsInWindow: activeEvents.length,
      maxAllowed,
    });

    if (lockOnBreach) {
      await triggerSecurityLockdown(groupId, breachReason);
    }

    return {
      allowed: false,
      isBreached: true,
      actionCountInWindow: activeEvents.length,
      maxAllowed,
      windowSeconds: customWindowSeconds,
      reason: breachReason,
    };
  }

  // Record this valid event into sliding window
  activeEvents.push({
    groupId,
    executorId,
    actionType,
    timestamp: now,
  });
  actionWindowStore.set(key, activeEvents);

  return {
    allowed: true,
    isBreached: false,
    actionCountInWindow: activeEvents.length,
    maxAllowed,
    windowSeconds: customWindowSeconds,
  };
}

/**
 * Triggers an immediate security lockdown for a group.
 * Sets status to LOCKED and sends webhook notification if configured.
 */
export async function triggerSecurityLockdown(groupId: string, reason: string) {
  logger.error(`TRIGGERING SECURITY LOCKDOWN on RankHub for group ${groupId}: ${reason}`);

  // Update in-memory state
  memoryLockdownStore.set(groupId, {
    status: "LOCKED",
    lockedAt: new Date(),
    lockedReason: reason,
  });

  let webhookUrl: string | null = null;

  try {
    const updated = await prisma.rankHubSecurityConfig.upsert({
      where: { groupId },
      update: {
        status: "LOCKED",
        lockedAt: new Date(),
        lockedReason: reason,
      },
      create: {
        groupId,
        status: "LOCKED",
        lockedAt: new Date(),
        lockedReason: reason,
        antiNukeEnabled: true,
        maxDemotionsPerMinute: DEFAULT_MAX_DEMOTIONS_PER_MINUTE,
        lockOnBreach: true,
      },
    });
    webhookUrl = updated.notifyWebhookUrl;
  } catch (err: any) {
    logger.error("Failed to update RankHubSecurityConfig in DB during lockdown trigger", { error: err?.message });
  }

  // Webhook notification dispatch
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "🚨 RankHub Anti-Nuke Security Lockdown Triggered",
              description: `A rogue action threshold was breached. Ranking operations have been **IMMEDIATELY LOCKED** to prevent malicious group demotions or exile sweeps.`,
              color: 0xff0033, // Red
              fields: [
                { name: "Group ID", value: String(groupId), inline: true },
                { name: "Timestamp", value: new Date().toISOString(), inline: true },
                { name: "Trigger Reason", value: reason },
              ],
              footer: { text: "RoleFlow RankHub Security Sentinel" },
            },
          ],
        }),
      });
    } catch (err: any) {
      logger.warn(`Failed to post alert webhook for lockdown on group ${groupId}: ${err?.message}`);
    }
  }

  return { success: true, groupId, status: "LOCKED", reason };
}

/**
 * Unlocks security ranking operations for a group.
 */
export async function unlockSecurity(groupId: string, ownerId?: string) {
  logger.info(`Unlocking RankHub ranking operations for group ${groupId} by ${ownerId || "Staff Owner"}`);

  // Update in-memory state
  memoryLockdownStore.set(groupId, {
    status: "NORMAL",
  });

  // Clear in-memory event window for this group
  for (const key of actionWindowStore.keys()) {
    if (key.startsWith(`${groupId}:`)) {
      actionWindowStore.delete(key);
    }
  }

  try {
    const updated = await prisma.rankHubSecurityConfig.upsert({
      where: { groupId },
      update: {
        status: "NORMAL",
        lockedAt: null,
        lockedReason: null,
      },
      create: {
        groupId,
        status: "NORMAL",
        antiNukeEnabled: true,
        maxDemotionsPerMinute: DEFAULT_MAX_DEMOTIONS_PER_MINUTE,
        lockOnBreach: true,
      },
    });

    return { success: true, groupId, status: updated.status };
  } catch (err: any) {
    logger.error("Failed to update security config to NORMAL in DB", { error: err?.message });
    return { success: true, groupId, status: "NORMAL" };
  }
}

/**
 * Resets memory state (useful for unit testing).
 */
export function resetAntiNukeMemoryState() {
  actionWindowStore.clear();
}
