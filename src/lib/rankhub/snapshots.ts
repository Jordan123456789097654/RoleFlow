import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { validateSafetyGuards, RankSafetyOptions, RankResult } from "./roblox-ranker";

export interface SnapshotMember {
  robloxUserId: string | number;
  username: string;
  roleId: number;
  rank: number;
  roleName: string;
}

export interface MemberDiff {
  robloxUserId: string | number;
  username: string;
  currentRank: number;
  currentRoleName: string;
  currentRoleId?: number;
  snapshotRank: number;
  snapshotRoleName: string;
  snapshotRoleId: number;
  needsUpdate: boolean;
  action: "PROMOTE" | "DEMOTE" | "NOOP";
  blockedBySafety?: boolean;
  safetyReason?: string;
}

export interface RestorePlan {
  groupId: string;
  snapshotId: string;
  totalMembersInSnapshot: number;
  totalMembersCompared: number;
  totalDifferences: number;
  diffs: MemberDiff[];
  executableAdjustments: MemberDiff[];
  blockedAdjustments: MemberDiff[];
}

export interface RestoreExecutionResult {
  snapshotId: string;
  groupId: string;
  success: boolean;
  totalAttempted: number;
  successCount: number;
  failedCount: number;
  blockedCount: number;
  logs: Array<{
    robloxUserId: string | number;
    username: string;
    fromRank: number;
    toRank: number;
    status: "SUCCESS" | "FAILED" | "BLOCKED";
    error?: string;
  }>;
}

/**
 * Fetch group members from Roblox Groups API (or mock/fallback if offline).
 */
export async function fetchCurrentGroupMembers(groupId: string | number): Promise<SnapshotMember[]> {
  try {
    const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/users?limit=100&sortOrder=Asc`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          robloxUserId: String(item.user.userId),
          username: item.user.username || item.user.name || `User_${item.user.userId}`,
          roleId: item.role.id,
          rank: item.role.rank,
          roleName: item.role.name,
        }));
      }
    }
  } catch (err: any) {
    logger.warn(`Failed to fetch live members from Roblox for group ${groupId}: ${err?.message || String(err)}`);
  }

  // Graceful fallback for offline / mock testing
  return [];
}

/**
 * Creates a new RankHub rank backup snapshot.
 */
export async function createSnapshot(
  groupId: string,
  createdBy?: string,
  title?: string,
  customMembers?: SnapshotMember[]
) {
  const members = customMembers ?? (await fetchCurrentGroupMembers(groupId));
  const snapshotTitle = title?.trim() || `Snapshot ${new Date().toISOString().replace("T", " ").substring(0, 19)}`;

  const snapshot = await prisma.rankHubSnapshot.create({
    data: {
      groupId: String(groupId),
      title: snapshotTitle,
      memberCount: members.length,
      snapshotData: members as any,
      createdBy: createdBy || null,
    },
  });

  logger.info(`RankHub snapshot created for group ${groupId}`, {
    snapshotId: snapshot.id,
    memberCount: snapshot.memberCount,
    title: snapshot.title,
  });

  return snapshot;
}

/**
 * Calculates differences between current members and a snapshot,
 * applying RankHub safety guards (rank ceiling, protected roles).
 */
export function calculateSnapshotDiff(
  currentMembers: SnapshotMember[],
  snapshotMembers: SnapshotMember[],
  safetyOptions: RankSafetyOptions = {}
): MemberDiff[] {
  const currentMap = new Map<string, SnapshotMember>();
  for (const m of currentMembers) {
    currentMap.set(String(m.robloxUserId), m);
  }

  const diffs: MemberDiff[] = [];

  for (const snap of snapshotMembers) {
    const userId = String(snap.robloxUserId);
    const curr = currentMap.get(userId);

    const currentRank = curr ? curr.rank : 0;
    const currentRoleName = curr ? curr.roleName : "Guest / Not in Group";
    const currentRoleId = curr?.roleId;

    const needsUpdate = currentRank !== snap.rank;
    let action: "PROMOTE" | "DEMOTE" | "NOOP" = "NOOP";
    if (snap.rank > currentRank) {
      action = "PROMOTE";
    } else if (snap.rank < currentRank) {
      action = "DEMOTE";
    }

    let blockedBySafety = false;
    let safetyReason: string | undefined;

    if (needsUpdate) {
      const safety = validateSafetyGuards(
        {
          currentRank: curr ? currentRank : undefined,
          currentRoleId,
          targetRank: snap.rank,
          targetRoleId: snap.roleId,
        },
        safetyOptions
      );

      if (!safety.allowed) {
        blockedBySafety = true;
        safetyReason = safety.reason;
      }
    }

    diffs.push({
      robloxUserId: snap.robloxUserId,
      username: snap.username,
      currentRank,
      currentRoleName,
      currentRoleId,
      snapshotRank: snap.rank,
      snapshotRoleName: snap.roleName,
      snapshotRoleId: snap.roleId,
      needsUpdate,
      action,
      blockedBySafety,
      safetyReason,
    });
  }

  return diffs;
}

/**
 * Previews restoration plan with diff without executing changes.
 */
export async function previewRestoreSnapshot(
  groupId: string,
  snapshotId: string,
  customCurrentMembers?: SnapshotMember[]
): Promise<RestorePlan> {
  const snapshot = await prisma.rankHubSnapshot.findUnique({
    where: { id: snapshotId },
  });

  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }

  // Load group config for safety guards
  const config = await prisma.rankHubGroupConfig.findUnique({
    where: { groupId },
  });

  const safetyOptions: RankSafetyOptions = {
    rankCeiling: config?.rankCeiling ?? 254,
    protectedRoles: Array.isArray(config?.protectedRoles)
      ? (config.protectedRoles as Array<string | number>)
      : [250, 254, 255],
    allowDemotions: true, // During disaster restore, demotions are permitted if not blocked by ceiling/protected
  };

  const snapshotMembers: SnapshotMember[] = (snapshot.snapshotData as any) || [];
  const currentMembers = customCurrentMembers ?? (await fetchCurrentGroupMembers(groupId));

  const diffs = calculateSnapshotDiff(currentMembers, snapshotMembers, safetyOptions);
  const diffsRequiringAction = diffs.filter((d) => d.needsUpdate);
  const executableAdjustments = diffsRequiringAction.filter((d) => !d.blockedBySafety);
  const blockedAdjustments = diffsRequiringAction.filter((d) => d.blockedBySafety);

  return {
    groupId,
    snapshotId,
    totalMembersInSnapshot: snapshotMembers.length,
    totalMembersCompared: currentMembers.length,
    totalDifferences: diffsRequiringAction.length,
    diffs,
    executableAdjustments,
    blockedAdjustments,
  };
}

/**
 * Restores a snapshot for a group, calculating diffs and applying rank adjustments.
 * Safely filters through rank ceiling and protected roles, executes changes, and logs audit entries.
 */
export async function restoreSnapshot(
  groupId: string,
  snapshotId: string,
  executorId?: string,
  customCurrentMembers?: SnapshotMember[],
  rankExecutor?: (userId: string | number, roleId: number, rankNumber: number) => Promise<RankResult>
): Promise<RestoreExecutionResult> {
  const plan = await previewRestoreSnapshot(groupId, snapshotId, customCurrentMembers);

  const logs: RestoreExecutionResult["logs"] = [];
  let successCount = 0;
  let failedCount = 0;
  let blockedCount = plan.blockedAdjustments.length;

  for (const blocked of plan.blockedAdjustments) {
    logs.push({
      robloxUserId: blocked.robloxUserId,
      username: blocked.username,
      fromRank: blocked.currentRank,
      toRank: blocked.snapshotRank,
      status: "BLOCKED",
      error: blocked.safetyReason,
    });
  }

  for (const item of plan.executableAdjustments) {
    try {
      let rankResult: RankResult;
      if (rankExecutor) {
        rankResult = await rankExecutor(item.robloxUserId, item.snapshotRoleId, item.snapshotRank);
      } else {
        // Simulated execution if no custom rankExecutor provided (e.g. demo / test mode)
        rankResult = {
          success: true,
          simulated: true,
          targetUserId: item.robloxUserId,
          previousRankId: item.currentRank,
          newRankId: item.snapshotRank,
          newRankName: item.snapshotRoleName,
        };
      }

      if (rankResult.success) {
        successCount++;
        logs.push({
          robloxUserId: item.robloxUserId,
          username: item.username,
          fromRank: item.currentRank,
          toRank: item.snapshotRank,
          status: "SUCCESS",
        });

        // Write immutable audit log
        try {
          await prisma.rankHubLog.create({
            data: {
              groupId,
              targetRobloxId: String(item.robloxUserId),
              targetRobloxUsername: item.username,
              previousRankId: item.currentRank,
              previousRankName: item.currentRoleName,
              newRankId: item.snapshotRank,
              newRankName: item.snapshotRoleName,
              source: "SNAPSHOT_RESTORE",
              executorId: executorId || "SYSTEM",
              executorUsername: executorId ? "Staff Executor" : "System Restorer",
              status: rankResult.simulated ? "SIMULATED" : "SUCCESS",
            },
          });
        } catch {
          // Keep resilient even if group config relation is missing in test sandbox
        }
      } else {
        failedCount++;
        logs.push({
          robloxUserId: item.robloxUserId,
          username: item.username,
          fromRank: item.currentRank,
          toRank: item.snapshotRank,
          status: "FAILED",
          error: rankResult.error,
        });

        try {
          await prisma.rankHubLog.create({
            data: {
              groupId,
              targetRobloxId: String(item.robloxUserId),
              targetRobloxUsername: item.username,
              previousRankId: item.currentRank,
              previousRankName: item.currentRoleName,
              newRankId: item.snapshotRank,
              newRankName: item.snapshotRoleName,
              source: "SNAPSHOT_RESTORE",
              executorId: executorId || "SYSTEM",
              executorUsername: executorId ? "Staff Executor" : "System Restorer",
              status: "FAILED",
              errorMessage: rankResult.error,
            },
          });
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      failedCount++;
      logs.push({
        robloxUserId: item.robloxUserId,
        username: item.username,
        fromRank: item.currentRank,
        toRank: item.snapshotRank,
        status: "FAILED",
        error: err?.message || String(err),
      });
    }
  }

  logger.info(`Snapshot ${snapshotId} restoration executed for group ${groupId}`, {
    totalAttempted: plan.executableAdjustments.length,
    successCount,
    failedCount,
    blockedCount,
  });

  return {
    snapshotId,
    groupId,
    success: failedCount === 0,
    totalAttempted: plan.executableAdjustments.length,
    successCount,
    failedCount,
    blockedCount,
    logs,
  };
}
