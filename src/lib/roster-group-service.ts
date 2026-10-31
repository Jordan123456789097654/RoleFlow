import { prisma } from "./prisma";
import { RobloxClientInterface, robloxGroupsClient } from "./roblox-groups";
import { logger } from "./logger";

export interface ConnectGroupInput {
  userId: string;
  userRobloxId: string;
  robloxGroupId: string | number;
}

export interface PreviewGroupResult {
  eligible: boolean;
  userRank: number;
  groupName: string;
  memberCount: number;
  roles: Array<{ id: number; name: string; rank: number }>;
  membersPreview: Array<{ userId: number; username: string; rank: string }>;
  error?: string;
}

/**
 * Stage 3.1: Preview Roblox group data and verify user management authority.
 * Does NOT write any database records until user explicitly confirms.
 */
export async function previewRobloxGroup(
  input: ConnectGroupInput,
  client: RobloxClientInterface = robloxGroupsClient
): Promise<PreviewGroupResult> {
  const gId = String(input.robloxGroupId).trim();

  // 1. Fetch group details
  const group = await client.getGroupDetails(gId);
  if (!group) {
    return {
      eligible: false,
      userRank: 0,
      groupName: "",
      memberCount: 0,
      roles: [],
      membersPreview: [],
      error: "Group not found or Roblox API currently unreachable.",
    };
  }

  // 2. Verify user's rank in group (minimum rank 200 or group owner required to manage)
  const userRank = await client.getUserGroupRank(input.userRobloxId, gId);
  const isOwner = group.owner?.id === Number(input.userRobloxId);
  const isManager = userRank >= 200 || isOwner;

  if (!isManager) {
    return {
      eligible: false,
      userRank,
      groupName: group.name,
      memberCount: group.memberCount,
      roles: [],
      membersPreview: [],
      error: "You do not have management permissions (Rank >= 200 or Owner required) in this Roblox group.",
    };
  }

  // 3. Fetch roles and member preview
  const roles = await client.getGroupRoles(gId);
  const members = await client.getGroupMembers(gId, 50);

  return {
    eligible: true,
    userRank,
    groupName: group.name,
    memberCount: group.memberCount,
    roles: roles.map((r) => ({ id: r.id, name: r.name, rank: r.rank })),
    membersPreview: members.map((m) => ({
      userId: m.user.userId,
      username: m.user.username,
      rank: m.role.name,
    })),
  };
}

/**
 * Stage 3.2: Confirm and commit group connection into the Roster database.
 * Writes RosterGroup, RosterMembership for the owner, and preliminary staff records.
 */
export async function confirmConnectRobloxGroup(
  input: ConnectGroupInput,
  client: RobloxClientInterface = robloxGroupsClient
): Promise<{ success: boolean; groupId?: string; error?: string }> {
  // 1. Verify preview / eligibility again on server
  const preview = await previewRobloxGroup(input, client);
  if (!preview.eligible) {
    return { success: false, error: preview.error || "Eligibility verification failed." };
  }

  const gIdStr = String(input.robloxGroupId).trim();

  // 2. Prevent duplicate group connection
  const existing = await prisma.rosterGroup.findUnique({
    where: { robloxGroupId: gIdStr },
  });

  if (existing) {
    return { success: false, error: "This Roblox group is already connected to Roster." };
  }

  // 3. Create RosterGroup and Owner Membership in an atomic transaction
  try {
    const created = await prisma.$transaction(async (tx) => {
      const g = await tx.rosterGroup.create({
        data: {
          robloxGroupId: gIdStr,
          name: preview.groupName,
          ownerUserId: input.userId,
        },
      });

      // Owner membership
      await tx.rosterMembership.create({
        data: {
          groupId: g.id,
          userId: input.userId,
          robloxUserId: String(input.userRobloxId),
          username: "Owner",
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      // Audit entry for creation
      await tx.rosterAuditEntry.create({
        data: {
          groupId: g.id,
          actorUserId: input.userId,
          event: "GROUP_CONNECTED",
          detail: JSON.stringify({
            robloxGroupId: gIdStr,
            name: preview.groupName,
            importedMembersCount: preview.membersPreview.length,
          }),
        },
      });

      // Import initial member staff records
      for (const m of preview.membersPreview) {
        await tx.rosterStaff.create({
          data: {
            groupId: g.id,
            robloxUserId: String(m.userId),
            rank: m.rank,
            status: "ACTIVE",
          },
        });
      }

      return g;
    });

    return { success: true, groupId: created.id };
  } catch (err: any) {
    logger.error("confirmConnectRobloxGroup error:", { error: err?.message || String(err) });
    return { success: false, error: "Failed to persist group into Roster." };
  }
}
