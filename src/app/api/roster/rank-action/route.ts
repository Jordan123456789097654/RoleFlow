import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";
import { RobloxRanker, validateSafetyGuards } from "@/lib/rankhub/roblox-ranker";
import { checkAntiNukeRate } from "@/lib/rankhub/anti-nuke";
import { getRobloxGroupRoles } from "@/lib/roblox";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export interface RankActionRequestBody {
  groupId: string;
  targetRobloxId: string;
  targetRobloxUsername?: string;
  action: "PROMOTE" | "DEMOTE" | "SET_RANK";
  targetRankId?: number;
}

/**
 * POST /api/roster/rank-action
 * Executes safe Roblox ranking actions (PROMOTE, DEMOTE, SET_RANK) directly from Roster.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    // 1. Check Roster access
    if (!canAccessRoster({ userId: user?.id, isSiteAdmin: user?.isSiteAdmin, siteRole: user?.siteRole })) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RankActionRequestBody = await request.json().catch(() => ({}));
    const { groupId, targetRobloxId, targetRobloxUsername, action, targetRankId } = body;

    if (!groupId || !targetRobloxId || !action) {
      return NextResponse.json(
        { error: "groupId, targetRobloxId, and action are required." },
        { status: 400 }
      );
    }

    if (!["PROMOTE", "DEMOTE", "SET_RANK"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be PROMOTE, DEMOTE, or SET_RANK." },
        { status: 400 }
      );
    }

    // 2. Find RosterGroup and verify caller has OWNER or MANAGER permission
    const rosterGroup = await prisma.rosterGroup.findUnique({
      where: { id: groupId },
      include: {
        memberships: true,
        rankHubConfig: true,
      },
    });

    if (!rosterGroup || rosterGroup.archivedAt) {
      return NextResponse.json({ error: "Roster group not found or archived." }, { status: 404 });
    }

    let callerRole: RosterRole | null = null;
    if (rosterGroup.ownerUserId === user.id) {
      callerRole = "OWNER";
    } else {
      const membership = rosterGroup.memberships.find((m) => m.userId === user.id);
      if (membership) {
        callerRole = membership.role as RosterRole;
      }
    }

    // Callers must have manager/owner permission (roster.edit capability)
    const canManage = hasRosterPermission(callerRole, "roster.edit");
    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: You must be a Manager or Owner to rank staff." },
        { status: 403 }
      );
    }

    // 3. Fetch active RankHubGroupConfig (Open Cloud or Cookie credentials)
    // We check either directly attached rankHubConfig or by groupId / robloxGroupId
    let config = rosterGroup.rankHubConfig;
    if (!config) {
      config = await prisma.rankHubGroupConfig.findFirst({
        where: {
          OR: [{ groupId: rosterGroup.id }, { robloxGroupId: rosterGroup.robloxGroupId }],
        },
      });
    }

    if (!config || (!config.openCloudKeyEncrypted && !config.cookieEncrypted)) {
      return NextResponse.json(
        {
          error: "RankHub credentials not configured for this group.",
          code: "RANKHUB_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    // 4. Anti-nuke status check
    const rateCheck = await checkAntiNukeRate(
      config.groupId,
      user.id,
      action === "DEMOTE" ? "DEMOTE" : "DEMOTE"
    );

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: rateCheck.reason || "Ranking operations are locked by Anti-Nuke security.",
          code: "ANTI_NUKE_LOCKED",
        },
        { status: 423 } // 423 Locked
      );
    }

    // 5. Fetch group roles from Roblox to determine current and next ranks
    const groupRoles = await getRobloxGroupRoles(rosterGroup.robloxGroupId);
    if (!groupRoles || groupRoles.length === 0) {
      return NextResponse.json(
        { error: "Could not retrieve roles from Roblox for this group." },
        { status: 502 }
      );
    }

    // Sort valid group roles by rank ascending (ignoring rank 0 Guest for assignment)
    const validRoles = groupRoles
      .filter((r) => r.rank > 0)
      .sort((a, b) => a.rank - b.rank);

    // Determine target member's current rank in Roster
    const currentRankCache = await prisma.rosterRankCache.findUnique({
      where: {
        groupId_robloxUserId: {
          groupId: rosterGroup.id,
          robloxUserId: String(targetRobloxId),
        },
      },
    });

    const staffRecord = await prisma.rosterStaff.findUnique({
      where: {
        groupId_robloxUserId: {
          groupId: rosterGroup.id,
          robloxUserId: String(targetRobloxId),
        },
      },
    });

    let currentRankNumber = currentRankCache?.rankId;
    let currentRankName = currentRankCache?.rank || staffRecord?.rank;

    // If not cached, match by rank name in roles
    if (currentRankNumber === undefined && currentRankName) {
      const match = validRoles.find((r) => r.name.toLowerCase() === currentRankName!.toLowerCase());
      if (match) currentRankNumber = match.rank;
    }

    // Default to lowest rank if unknown
    if (currentRankNumber === undefined) {
      currentRankNumber = validRoles[0]?.rank ?? 1;
    }

    // Determine target role based on action
    let nextRole: { id: number; rank: number; name: string } | undefined;

    if (action === "SET_RANK") {
      if (targetRankId === undefined) {
        return NextResponse.json(
          { error: "targetRankId is required for SET_RANK action." },
          { status: 400 }
        );
      }
      nextRole = validRoles.find((r) => r.rank === targetRankId || r.id === targetRankId);
      if (!nextRole) {
        return NextResponse.json(
          { error: `No role found matching rank ID ${targetRankId}.` },
          { status: 400 }
        );
      }
    } else if (action === "PROMOTE") {
      // Find the next role in the ladder with higher rank number
      const higherRoles = validRoles.filter((r) => r.rank > currentRankNumber!);
      if (higherRoles.length === 0) {
        return NextResponse.json(
          { error: "Member is already at the maximum rank available for promotion." },
          { status: 400 }
        );
      }
      nextRole = higherRoles[0];
    } else if (action === "DEMOTE") {
      // Find the previous role in the ladder with lower rank number
      const lowerRoles = validRoles.filter((r) => r.rank < currentRankNumber!);
      if (lowerRoles.length === 0) {
        return NextResponse.json(
          { error: "Member is already at the lowest rank in the group." },
          { status: 400 }
        );
      }
      nextRole = lowerRoles[lowerRoles.length - 1];
    }

    if (!nextRole) {
      return NextResponse.json(
        { error: "Could not determine target role." },
        { status: 400 }
      );
    }

    // Parse protected roles
    let protectedRolesList: Array<number | string> = [];
    if (Array.isArray(config.protectedRoles)) {
      protectedRolesList = config.protectedRoles as Array<number | string>;
    } else if (typeof config.protectedRoles === "string") {
      try {
        protectedRolesList = JSON.parse(config.protectedRoles);
      } catch {
        protectedRolesList = [];
      }
    }

    // 6. Pre-validate Safety Guards
    const safety = validateSafetyGuards(
      {
        currentRank: currentRankNumber,
        targetRank: nextRole.rank,
        targetRoleId: nextRole.id,
      },
      {
        rankCeiling: config.rankCeiling,
        protectedRoles: protectedRolesList,
        allowDemotions: action === "DEMOTE" ? true : config.allowDemotions,
      }
    );

    if (!safety.allowed) {
      return NextResponse.json(
        { error: safety.reason || "Safety check blocked ranking action." },
        { status: 422 }
      );
    }

    // 7. Initialize RobloxRanker and execute ranking
    const ranker = new RobloxRanker({
      groupId: rosterGroup.robloxGroupId,
      authType: config.authType === "COOKIE" ? "COOKIE" : "OPEN_CLOUD",
      openCloudKey: config.openCloudKeyEncrypted || undefined,
      cookie: config.cookieEncrypted || undefined,
      rankCeiling: config.rankCeiling,
      protectedRoles: protectedRolesList,
      allowDemotions: true,
    });

    const rankResult = await ranker.executeRank({
      robloxUserId: targetRobloxId,
      currentRankId: currentRankNumber,
      targetRankId: nextRole.rank,
      targetRoleId: nextRole.id,
    });

    const rankStatus = rankResult.success ? "SUCCESS" : "FAILED";

    // 8. Log action in RankHubLog
    try {
      await prisma.rankHubLog.create({
        data: {
          groupId: config.groupId,
          targetRobloxId: String(targetRobloxId),
          targetRobloxUsername: targetRobloxUsername || null,
          previousRankId: currentRankNumber,
          previousRankName: currentRankName || null,
          newRankId: nextRole.rank,
          newRankName: nextRole.name,
          source: "MANUAL_WEB",
          executorId: user.id,
          executorUsername: user.username,
          status: rankStatus,
          errorMessage: rankResult.error || null,
        },
      });
    } catch (logErr: any) {
      logger.error("Failed to write to RankHubLog:", { error: logErr?.message });
    }

    // 9. Log action in RosterModerationAction / RosterAction audit trail
    try {
      await prisma.rosterAction.create({
        data: {
          groupId: rosterGroup.id,
          targetRobloxUserId: String(targetRobloxId),
          actorUserId: user.id,
          type: action === "PROMOTE" ? "COMMENDATION" : action === "DEMOTE" ? "NOTE" : "NOTE",
          reason: `Roster 1-Click Rank Action: ${action} to ${nextRole.name} (Rank ${nextRole.rank}). Status: ${rankStatus}${
            rankResult.error ? ` - Error: ${rankResult.error}` : ""
          }`,
        },
      });

      await prisma.rosterAuditEntry.create({
        data: {
          groupId: rosterGroup.id,
          actorUserId: user.id,
          event: `ROSTER_${action}`,
          detail: JSON.stringify({
            targetRobloxId,
            targetRobloxUsername,
            previousRank: currentRankNumber,
            newRank: nextRole.rank,
            newRoleName: nextRole.name,
            success: rankResult.success,
            error: rankResult.error,
          }),
        },
      });
    } catch (auditErr: any) {
      logger.error("Failed to write Roster audit action:", { error: auditErr?.message });
    }

    if (!rankResult.success) {
      return NextResponse.json(
        {
          error: rankResult.error || "Failed to execute rank update on Roblox.",
          success: false,
        },
        { status: 502 }
      );
    }

    // 10. Update Roster local cache (RosterRankCache and RosterStaff)
    try {
      await prisma.rosterRankCache.upsert({
        where: {
          groupId_robloxUserId: {
            groupId: rosterGroup.id,
            robloxUserId: String(targetRobloxId),
          },
        },
        update: {
          rank: nextRole.name,
          rankId: nextRole.rank,
        },
        create: {
          groupId: rosterGroup.id,
          robloxUserId: String(targetRobloxId),
          rank: nextRole.name,
          rankId: nextRole.rank,
        },
      });

      if (staffRecord) {
        await prisma.rosterStaff.update({
          where: { id: staffRecord.id },
          data: {
            rank: nextRole.name,
          },
        });
      }
    } catch (cacheErr: any) {
      logger.warn("Failed to update roster rank cache after promotion:", { error: cacheErr?.message });
    }

    return NextResponse.json({
      success: true,
      action,
      member: {
        robloxUserId: String(targetRobloxId),
        username: targetRobloxUsername,
        previousRankId: currentRankNumber,
        previousRankName: currentRankName,
        newRankId: nextRole.rank,
        newRankName: nextRole.name,
      },
    });
  } catch (err: any) {
    logger.error("Unexpected error in /api/roster/rank-action:", { error: err?.message || String(err) });
    return NextResponse.json(
      { error: err?.message || "Internal server error during ranking action." },
      { status: 500 }
    );
  }
}
