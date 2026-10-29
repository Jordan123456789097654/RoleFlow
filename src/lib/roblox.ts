/**
 * Roblox Open Cloud & Public API Helpers
 */

import { logger } from "@/lib/logger";

interface RobloxUserInfo {
  id: number;
  name: string;
  displayName: string;
  created: string; // ISO 8601 string, e.g. "2018-05-23T14:52:18.123Z"
}

interface RobloxGroupRole {
  id: number;
  name: string;
  rank: number; // 0 - 255
}

interface RobloxGroupRolesResponse {
  groupId: number;
  roles: RobloxGroupRole[];
}

/**
 * Fetch public user profile from Roblox API, including account created date.
 */
export async function getRobloxUserProfile(robloxUserId: string | number): Promise<RobloxUserInfo | null> {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${robloxUserId}`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      logger.warn(`Failed to fetch Roblox user profile for ${robloxUserId}: ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.json();
  } catch (err: any) {
    logger.error("Error fetching Roblox user profile:", { error: err?.message || String(err) });
    return null;
  }
}

/**
 * Check Roblox account age in days against a minimum threshold.
 * Returns { valid: boolean, ageDays: number, error?: string }
 */
export async function checkRobloxAccountAge(
  robloxUserId: string | number,
  minDays: number = 0
): Promise<{ valid: boolean; ageDays: number; error?: string }> {
  if (minDays <= 0) {
    return { valid: true, ageDays: 0 };
  }

  const profile = await getRobloxUserProfile(robloxUserId);
  if (!profile || !profile.created) {
    return { valid: false, ageDays: 0, error: "Unable to retrieve Roblox account details." };
  }

  const createdTime = new Date(profile.created).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));

  if (diffDays < minDays) {
    return {
      valid: false,
      ageDays: diffDays,
      error: `Your Roblox account is ${diffDays} day(s) old. This community requires an account age of at least ${minDays} days to apply.`,
    };
  }

  return { valid: true, ageDays: diffDays };
}

/**
 * Check if a Roblox user owns a specified badge.
 * Uses official public API: https://badges.roblox.com/v1/users/{userId}/badges/awarded-dates?badgeIds={badgeId}
 */
export async function checkUserBadgeOwnership(
  robloxUserId: string | number,
  badgeId: string | number
): Promise<{ owned: boolean; awardedDate?: string; error?: string }> {
  try {
    const cleanBadgeId = String(badgeId).trim();
    if (!cleanBadgeId) {
      return { owned: true };
    }

    const url = `https://badges.roblox.com/v1/users/${robloxUserId}/badges/awarded-dates?badgeIds=${cleanBadgeId}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      logger.warn(`Roblox badge check failed for user ${robloxUserId}, badge ${cleanBadgeId}: ${res.status}`);
      return { owned: false, error: "Failed to verify badge ownership with Roblox." };
    }

    const data = await res.json();
    // data.data is an array of { badgeId, awardedDate }
    const match = data.data?.find((b: any) => String(b.badgeId) === cleanBadgeId);

    if (match) {
      return { owned: true, awardedDate: match.awardedDate };
    }

    return { owned: false, error: `Required Roblox badge (${cleanBadgeId}) is missing from user profile.` };
  } catch (err: any) {
    logger.error("Error checking Roblox badge ownership:", { error: err?.message || String(err) });
    return { owned: false, error: "Roblox badge verification network error." };
  }
}

/**
 * List roles for a Roblox group to map rank numbers (0-255) to role IDs.
 */
export async function getRobloxGroupRoles(groupId: string | number): Promise<RobloxGroupRole[]> {
  try {
    const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/roles`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      logger.warn(`Failed to fetch group roles for group ${groupId}: ${res.status}`);
      return [];
    }

    const data: RobloxGroupRolesResponse = await res.json();
    return data.roles || [];
  } catch (err: any) {
    logger.error("Error fetching Roblox group roles:", { error: err?.message || String(err) });
    return [];
  }
}

/** Turns an Open Cloud failure into a message staff can act on. */
function openCloudErrorMessage(status: number, body: any): string {
  const detail = body?.message || body?.error || "";
  switch (status) {
    case 400:
      return `Roblox rejected the rank change${detail ? `: ${detail}` : "."} Check that the target role still exists in the group.`;
    case 401:
      return "The Open Cloud API key is invalid or has expired. Create a new key in the Roblox Creator Hub and save it in Gating settings.";
    case 403:
      return "The Open Cloud API key doesn't have permission to manage this group. Give the key group management access for this group and try again.";
    case 404:
      return "This applicant isn't a member of the group, so their rank can't be changed. Ask them to join the group first.";
    case 429:
      return "Roblox is rate-limiting rank changes. Wait a minute and try again.";
    default:
      return detail || `Roblox returned an unexpected error (${status}).`;
  }
}

/**
 * Update a group member's rank using Roblox Open Cloud v2 Groups API:
 * PATCH https://apis.roblox.com/cloud/v2/groups/{groupId}/memberships/{userId}
 *
 * rankNumberOrRoleId: rank number (1-255) or role ID.
 * If rankNumberOrRoleId <= 255, we resolve the role ID corresponding to that rank number first.
 */
export async function setGroupMemberRank(
  groupId: string | number,
  robloxUserId: string | number,
  rankNumberOrRoleId: number,
  apiKey: string
): Promise<{ success: boolean; roleId?: string | number; error?: string; rawResponse?: any }> {
  try {
    const cleanApiKey = apiKey.trim();
    if (!cleanApiKey) {
      return { success: false, error: "Roblox Open Cloud API Key is missing." };
    }

    let targetRoleId: string | number = rankNumberOrRoleId;

    // If rankNumberOrRoleId is a rank number (typically 1-255), resolve the role ID from the group
    if (rankNumberOrRoleId >= 1 && rankNumberOrRoleId <= 255) {
      const roles = await getRobloxGroupRoles(groupId);
      const roleMatch = roles.find((r) => r.rank === rankNumberOrRoleId);
      if (roleMatch) {
        targetRoleId = roleMatch.id;
      } else {
        logger.warn(`Could not find group role with rank ${rankNumberOrRoleId} in group ${groupId}, attempting direct role ID fallback.`);
      }
    }

    // Roblox Open Cloud v2 Groups API:
    // PATCH https://apis.roblox.com/cloud/v2/groups/{groupId}/memberships/{userId}
    // Headers: x-api-key: {apiKey}, Content-Type: application/json
    // Body: { "role": "groups/{groupId}/roles/{targetRoleId}" }
    // UpdateMask can also be passed via query or body: updateMask=role
    const url = `https://apis.roblox.com/cloud/v2/groups/${groupId}/memberships/${robloxUserId}?updateMask=role`;
    const rolePath = `groups/${groupId}/roles/${targetRoleId}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": cleanApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: rolePath,
      }),
    });

    const resText = await res.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(resText);
    } catch {
      resJson = { raw: resText };
    }

    if (!res.ok) {
      const errMsg = openCloudErrorMessage(res.status, resJson);
      logger.error(`Roblox Open Cloud rank update failed (${res.status}): ${errMsg}`, typeof resJson === "object" && resJson ? resJson : { res: String(resJson) });
      return {
        success: false,
        roleId: targetRoleId,
        error: errMsg,
        rawResponse: resJson,
      };
    }

    logger.info(`Successfully ranked Roblox user ${robloxUserId} to role ${rolePath} in group ${groupId}`);
    return {
      success: true,
      roleId: targetRoleId,
      rawResponse: resJson,
    };
  } catch (err: any) {
    logger.error("Exception during setGroupMemberRank:", { error: err?.message || String(err) });
    return {
      success: false,
      error: err?.message || "Failed to execute Roblox Open Cloud API call.",
    };
  }
}

/**
 * Checks whether a Roblox user owns an Asset or a Game Pass. Needs a public inventory.
 */
export async function checkUserAssetOwnership(
  robloxUserId: string | number,
  assetId: string | number
): Promise<{ owned: boolean; error?: string }> {
  const id = String(assetId).trim();
  if (!/^\d{1,20}$/.test(id)) return { owned: true };
  try {
    let privateInventory = false;
    for (const type of ["Asset", "GamePass"]) {
      const res = await fetch(`https://inventory.roblox.com/v1/users/${robloxUserId}/items/${type}/${id}/is-owned`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.status === 403) privateInventory = true;
      if (res.ok && (await res.json()) === true) return { owned: true };
    }
    if (privateInventory) {
      return { owned: false, error: "Your Roblox inventory is private. Make it public to verify the required item, then try again." };
    }
    return { owned: false, error: `You do not own the required Roblox item (ID: ${id}).` };
  } catch (err: any) {
    logger.error("Error checking Roblox asset ownership:", { error: err?.message || String(err) });
    return { owned: false, error: "Roblox item verification network error." };
  }
}

export type UserGroupRole = {
  status: "member" | "not_member" | "unknown";
  roleName: string | null;
  rank: number | null;
};

/** The user's role in one group. "unknown" means Roblox couldn't answer, not that they aren't a member. */
export async function getUserGroupRole(robloxUserId: string | number, groupId: string | number): Promise<UserGroupRole> {
  const unknown: UserGroupRole = { status: "unknown", roleName: null, rank: null };
  try {
    const res = await fetch(`https://groups.roblox.com/v2/users/${robloxUserId}/groups/roles`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return unknown;

    const data: { data?: Array<{ group: { id: number }; role: { name: string; rank: number } }> } = await res.json();
    const hit = (data.data || []).find((g) => String(g.group.id) === String(groupId));
    if (!hit) return { status: "not_member", roleName: null, rank: null };
    return { status: "member", roleName: hit.role.name, rank: hit.role.rank };
  } catch (err: any) {
    logger.error("Error fetching Roblox group membership:", { error: err?.message || String(err) });
    return unknown;
  }
}
