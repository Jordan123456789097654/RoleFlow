import { logger } from "@/lib/logger";
import { decryptVaultSecret } from "./vault";
import { getRobloxGroupRoles } from "@/lib/roblox";

export type AuthType = "OPEN_CLOUD" | "COOKIE";

export interface RankSafetyOptions {
  rankCeiling?: number; // Maximum rank number (1-255) that can be assigned or altered. Defaults to 254.
  protectedRoles?: Array<number | string>; // Role IDs or rank numbers that cannot be touched.
  allowDemotions?: boolean; // Whether newRank < previousRank is allowed. Defaults to true or config setting.
}

export interface RankTarget {
  robloxUserId: string | number;
  currentRankId?: number; // Current rank number (0-255)
  currentRoleId?: number; // Current role ID
  targetRankId?: number; // Target rank number (1-255)
  targetRoleId?: number; // Target role ID
}

export interface RankerConfig {
  groupId: string | number;
  authType: AuthType;
  openCloudKey?: string; // Plaintext or encrypted
  cookie?: string; // Plaintext or encrypted
  rankCeiling?: number;
  protectedRoles?: Array<number | string>;
  allowDemotions?: boolean;
}

export interface RankResult {
  success: boolean;
  simulated?: boolean;
  targetUserId: string | number;
  previousRankId?: number;
  previousRankName?: string;
  newRankId: number;
  newRankName?: string;
  targetRoleId?: number | string;
  error?: string;
  rawResponse?: any;
}

// Global in-memory cache for CSRF tokens per cookie hash
const csrfTokenCache = new Map<string, { token: string; expiresAt: number }>();

/**
 * Validates safety rules prior to attempting any rank change:
 * 1. Checks rankCeiling: Neither the targetRank nor the member's current rank can exceed rankCeiling.
 * 2. Checks protectedRoles: Neither target rank/role nor member's current rank/role can be in protectedRoles.
 * 3. Checks allowDemotions: If currentRank > targetRank and allowDemotions is false, reject.
 */
export function validateSafetyGuards(
  target: { currentRank?: number; currentRoleId?: number; targetRank: number; targetRoleId?: number },
  options: RankSafetyOptions
): { allowed: boolean; reason?: string } {
  const ceiling = options.rankCeiling ?? 254;
  const protectedList = (options.protectedRoles || []).map((x) => String(x).trim());

  // Check Rank Ceiling on Target
  if (target.targetRank > ceiling) {
    return {
      allowed: false,
      reason: `Target rank (${target.targetRank}) exceeds configured rank ceiling (${ceiling}). Action blocked for safety.`,
    };
  }

  // Check Rank Ceiling on Current Member (cannot modify members at or above ceiling)
  if (target.currentRank !== undefined && target.currentRank > ceiling) {
    return {
      allowed: false,
      reason: `Target user holds rank (${target.currentRank}) which exceeds rank ceiling (${ceiling}). Action blocked for safety.`,
    };
  }

  // Check Protected Roles on Target
  if (protectedList.includes(String(target.targetRank)) || (target.targetRoleId && protectedList.includes(String(target.targetRoleId)))) {
    return {
      allowed: false,
      reason: `Target rank (${target.targetRank}) is in the protected roles list. Action blocked.`,
    };
  }

  // Check Protected Roles on Current Member
  if (
    (target.currentRank !== undefined && protectedList.includes(String(target.currentRank))) ||
    (target.currentRoleId !== undefined && protectedList.includes(String(target.currentRoleId)))
  ) {
    return {
      allowed: false,
      reason: `Target user is currently in a protected role/rank. Action blocked.`,
    };
  }

  // Check Demotion policy
  if (options.allowDemotions === false && target.currentRank !== undefined && target.targetRank < target.currentRank) {
    return {
      allowed: false,
      reason: `Demotions are disabled. Current rank: ${target.currentRank}, Target rank: ${target.targetRank}.`,
    };
  }

  return { allowed: true };
}

/**
 * Builds Open Cloud v2 membership patch request payload and URL.
 */
export function buildOpenCloudRankPayload(
  groupId: string | number,
  userId: string | number,
  targetRoleId: string | number
) {
  const url = `https://apis.roblox.com/cloud/v2/groups/${groupId}/memberships/${userId}?updateMask=role`;
  const rolePath = `groups/${groupId}/roles/${targetRoleId}`;
  return {
    url,
    method: "PATCH",
    headers: (apiKey: string) => ({
      "x-api-key": apiKey.trim(),
      "Content-Type": "application/json",
    }),
    body: {
      role: rolePath,
    },
  };
}

/**
 * Helper to get fresh or cached x-csrf-token for Roblox Cookie API.
 */
export async function getRobloxCsrfToken(cookie: string, forceRefresh = false): Promise<string | null> {
  const cacheKey = cookie.slice(-20);
  const cached = csrfTokenCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  try {
    const res = await fetch("https://auth.roblox.com/v2/login", {
      method: "POST",
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
        "Content-Length": "0",
      },
    });

    // Roblox returns 403 with x-csrf-token header
    const csrf = res.headers.get("x-csrf-token");
    if (csrf) {
      csrfTokenCache.set(cacheKey, { token: csrf, expiresAt: Date.now() + 15 * 60 * 1000 });
      return csrf;
    }

    return null;
  } catch (err: any) {
    logger.error("Failed to acquire Roblox CSRF token", { error: err?.message || String(err) });
    return null;
  }
}

/**
 * RobloxRanker client supporting Open Cloud API and Cookie API fallback
 * with strict safety guards (rank ceiling, protected roles, demotion check).
 */
export class RobloxRanker {
  private config: RankerConfig;

  constructor(config: RankerConfig) {
    this.config = config;
  }

  /**
   * Resolve target role ID and name from rank number or role ID.
   */
  async resolveGroupRole(
    groupId: string | number,
    rankOrRoleId: number
  ): Promise<{ roleId: number; rank: number; name: string } | null> {
    const roles = await getRobloxGroupRoles(groupId);
    if (!roles || roles.length === 0) return null;

    // Check if matching rank number (1-255)
    let match = roles.find((r) => r.rank === rankOrRoleId);
    if (!match) {
      // Check if matching role ID
      match = roles.find((r) => r.id === rankOrRoleId);
    }

    if (match) {
      return { roleId: match.id, rank: match.rank, name: match.name };
    }
    return null;
  }

  /**
   * Simulates a ranking action and evaluates safety guards without mutating live state.
   */
  async simulateRank(target: RankTarget): Promise<RankResult> {
    const targetRankId = target.targetRankId;
    if (targetRankId === undefined && target.targetRoleId === undefined) {
      return {
        success: false,
        simulated: true,
        targetUserId: target.robloxUserId,
        newRankId: 0,
        error: "Either targetRankId or targetRoleId must be provided.",
      };
    }

    // Role resolution
    let resolvedRank = targetRankId ?? 0;
    let resolvedRoleId = target.targetRoleId;
    let roleName = "Unknown Role";

    try {
      const roleInfo = await this.resolveGroupRole(this.config.groupId, targetRankId || target.targetRoleId!);
      if (roleInfo) {
        resolvedRank = roleInfo.rank;
        resolvedRoleId = roleInfo.roleId;
        roleName = roleInfo.name;
      }
    } catch {
      // Offline / fallback resolution
    }

    // Run Safety Guards
    const safety = validateSafetyGuards(
      {
        currentRank: target.currentRankId,
        currentRoleId: target.currentRoleId,
        targetRank: resolvedRank,
        targetRoleId: resolvedRoleId,
      },
      {
        rankCeiling: this.config.rankCeiling,
        protectedRoles: this.config.protectedRoles,
        allowDemotions: this.config.allowDemotions,
      }
    );

    if (!safety.allowed) {
      return {
        success: false,
        simulated: true,
        targetUserId: target.robloxUserId,
        previousRankId: target.currentRankId,
        newRankId: resolvedRank,
        targetRoleId: resolvedRoleId,
        error: safety.reason,
      };
    }

    return {
      success: true,
      simulated: true,
      targetUserId: target.robloxUserId,
      previousRankId: target.currentRankId,
      newRankId: resolvedRank,
      newRankName: roleName,
      targetRoleId: resolvedRoleId,
    };
  }

  /**
   * Executes rank change for a user using the configured auth type (Open Cloud or Cookie fallback).
   */
  async executeRank(target: RankTarget): Promise<RankResult> {
    const sim = await this.simulateRank(target);
    if (!sim.success) {
      return sim; // Blocked by safety guards or bad input
    }

    const resolvedRoleId = sim.targetRoleId;
    const targetRankNumber = sim.newRankId;
    const roleName = sim.newRankName;

    if (!resolvedRoleId) {
      return {
        success: false,
        targetUserId: target.robloxUserId,
        newRankId: targetRankNumber,
        error: `Could not resolve valid role ID for rank ${targetRankNumber} in group ${this.config.groupId}.`,
      };
    }

    if (this.config.authType === "OPEN_CLOUD") {
      return this.rankViaOpenCloud(target.robloxUserId, resolvedRoleId, targetRankNumber, roleName, target.currentRankId);
    } else {
      return this.rankViaCookie(target.robloxUserId, resolvedRoleId, targetRankNumber, roleName, target.currentRankId);
    }
  }

  /**
   * Open Cloud v2 API ranker execution
   */
  private async rankViaOpenCloud(
    robloxUserId: string | number,
    targetRoleId: string | number,
    targetRankNumber: number,
    roleName?: string,
    previousRankId?: number
  ): Promise<RankResult> {
    const rawKey = this.config.openCloudKey;
    const apiKey = decryptVaultSecret(rawKey);

    if (!apiKey) {
      return {
        success: false,
        targetUserId: robloxUserId,
        newRankId: targetRankNumber,
        error: "Open Cloud API key is unconfigured or decryption failed.",
      };
    }

    const payload = buildOpenCloudRankPayload(this.config.groupId, robloxUserId, targetRoleId);

    try {
      const res = await fetch(payload.url, {
        method: payload.method,
        headers: payload.headers(apiKey),
        body: JSON.stringify(payload.body),
      });

      const resText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(resText);
      } catch {
        resJson = { raw: resText };
      }

      if (!res.ok) {
        let errMessage = `Open Cloud rank error (${res.status}): ${resText}`;
        if (res.status === 401) errMessage = "Roblox Open Cloud API key is invalid or unauthorized.";
        if (res.status === 403) errMessage = "Open Cloud key lacks permissions for groups:memberships:write.";
        if (res.status === 404) errMessage = "User is not a member of this group.";
        if (res.status === 429) errMessage = "Roblox Open Cloud rate limit exceeded. Retry later.";

        return {
          success: false,
          targetUserId: robloxUserId,
          previousRankId,
          newRankId: targetRankNumber,
          targetRoleId,
          error: errMessage,
          rawResponse: resJson,
        };
      }

      return {
        success: true,
        targetUserId: robloxUserId,
        previousRankId,
        newRankId: targetRankNumber,
        newRankName: roleName,
        targetRoleId,
        rawResponse: resJson,
      };
    } catch (err: any) {
      logger.error("Exception during Open Cloud ranking:", { error: err?.message || String(err) });
      return {
        success: false,
        targetUserId: robloxUserId,
        previousRankId,
        newRankId: targetRankNumber,
        targetRoleId,
        error: err?.message || "Network error contacting Roblox Open Cloud API.",
      };
    }
  }

  /**
   * Cookie Authentication fallback execution (groups.roblox.com/v1/groups/{groupId}/users/{userId})
   * with automatic CSRF token retry.
   */
  private async rankViaCookie(
    robloxUserId: string | number,
    targetRoleId: string | number,
    targetRankNumber: number,
    roleName?: string,
    previousRankId?: number
  ): Promise<RankResult> {
    const rawCookie = this.config.cookie;
    const cookie = decryptVaultSecret(rawCookie);

    if (!cookie) {
      return {
        success: false,
        targetUserId: robloxUserId,
        newRankId: targetRankNumber,
        error: ".ROBLOSECURITY cookie is unconfigured or decryption failed.",
      };
    }

    const url = `https://groups.roblox.com/v1/groups/${this.config.groupId}/users/${robloxUserId}`;

    // Attempt with cached or newly fetched CSRF token
    let csrf = await getRobloxCsrfToken(cookie);

    const makeRequest = async (token: string | null) => {
      const headers: Record<string, string> = {
        Cookie: `.ROBLOSECURITY=${cookie}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers["X-CSRF-TOKEN"] = token;

      return fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ roleId: Number(targetRoleId) }),
      });
    };

    try {
      let res = await makeRequest(csrf);

      // CSRF token invalid / expired retry
      if (res.status === 403 && res.headers.get("x-csrf-token")) {
        const freshCsrf = res.headers.get("x-csrf-token")!;
        csrfTokenCache.set(cookie.slice(-20), { token: freshCsrf, expiresAt: Date.now() + 15 * 60 * 1000 });
        res = await makeRequest(freshCsrf);
      }

      const resText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(resText);
      } catch {
        resJson = { raw: resText };
      }

      if (!res.ok) {
        let errMessage = `Roblox Cookie API error (${res.status}): ${resText}`;
        if (res.status === 401) errMessage = ".ROBLOSECURITY cookie has expired or is invalid.";
        if (res.status === 403) errMessage = "Bot account lacks permission to manage roles in this group.";
        if (res.status === 404) errMessage = "User is not a member of this group.";
        if (res.status === 429) errMessage = "Roblox API rate limit exceeded.";

        return {
          success: false,
          targetUserId: robloxUserId,
          previousRankId,
          newRankId: targetRankNumber,
          targetRoleId,
          error: errMessage,
          rawResponse: resJson,
        };
      }

      return {
        success: true,
        targetUserId: robloxUserId,
        previousRankId,
        newRankId: targetRankNumber,
        newRankName: roleName,
        targetRoleId,
        rawResponse: resJson,
      };
    } catch (err: any) {
      logger.error("Exception during Cookie rank execution:", { error: err?.message || String(err) });
      return {
        success: false,
        targetUserId: robloxUserId,
        previousRankId,
        newRankId: targetRankNumber,
        targetRoleId,
        error: err?.message || "Network error contacting Roblox groups API.",
      };
    }
  }
}
