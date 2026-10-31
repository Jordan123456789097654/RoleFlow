import { logger } from "./logger";

export interface RobloxGroupDetail {
  id: number;
  name: string;
  description: string;
  owner: {
    id?: number;
    userId?: number;
    username?: string;
    displayName?: string;
    hasVerifiedBadge?: boolean;
  } | null;
  memberCount: number;
}

export interface RobloxGroupRoleItem {
  id: number;
  name: string;
  rank: number; // 0 - 255
  memberCount?: number;
}

export interface RobloxGroupMemberItem {
  user: {
    userId: number;
    username: string;
    displayName: string;
    hasVerifiedBadge?: boolean;
  };
  role: {
    id: number;
    name: string;
    rank: number;
  };
}

export interface RobloxClientInterface {
  getGroupDetails(groupId: string | number): Promise<RobloxGroupDetail | null>;
  getGroupRoles(groupId: string | number): Promise<RobloxGroupRoleItem[]>;
  getGroupMembers(groupId: string | number, limit?: number): Promise<RobloxGroupMemberItem[]>;
  getUserGroupRank(robloxUserId: string | number, groupId: string | number): Promise<number>;
}

// In-memory cache with timestamps: key -> { data, expiresAt }
const groupCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes default

export class RealRobloxGroupsClient implements RobloxClientInterface {
  async getGroupDetails(groupId: string | number): Promise<RobloxGroupDetail | null> {
    const key = `group_details_${groupId}`;
    const cached = groupCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 429) {
          logger.warn(`Roblox rate limit encountered for group ${groupId}`);
        }
        return null;
      }

      const data = await res.json();
      groupCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    } catch (err: any) {
      logger.error("Roblox getGroupDetails error:", { error: err?.message || String(err) });
      return null;
    }
  }

  async getGroupRoles(groupId: string | number): Promise<RobloxGroupRoleItem[]> {
    const key = `group_roles_${groupId}`;
    const cached = groupCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/roles`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) return [];
      const data = await res.json();
      const roles = data.roles || [];
      groupCache.set(key, { data: roles, expiresAt: Date.now() + CACHE_TTL_MS });
      return roles;
    } catch (err: any) {
      logger.error("Roblox getGroupRoles error:", { error: err?.message || String(err) });
      return [];
    }
  }

  async getGroupMembers(groupId: string | number, limit = 100): Promise<RobloxGroupMemberItem[]> {
    try {
      const res = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/users?limit=${Math.min(limit, 100)}&sortOrder=Desc`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    } catch (err: any) {
      logger.error("Roblox getGroupMembers error:", { error: err?.message || String(err) });
      return [];
    }
  }

  async getUserGroupRank(robloxUserId: string | number, groupId: string | number): Promise<number> {
    try {
      const res = await fetch(`https://groups.roblox.com/v2/users/${robloxUserId}/groups/roles`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return 0;
      const data: { data?: Array<{ group: { id: number }; role: { rank: number } }> } = await res.json();
      const match = (data.data || []).find((g) => String(g.group.id) === String(groupId));
      return match?.role?.rank || 0;
    } catch {
      return 0;
    }
  }
}

/**
 * Deterministic Mock Client for robust unit testing and simulated failure modes.
 */
export class FakeRobloxGroupsClient implements RobloxClientInterface {
  public groups = new Map<number, RobloxGroupDetail>();
  public roles = new Map<number, RobloxGroupRoleItem[]>();
  public members = new Map<number, RobloxGroupMemberItem[]>();
  public userRanks = new Map<string, number>(); // `${userId}_${groupId}` -> rank
  public rateLimitNext = false;
  public outageNext = false;

  async getGroupDetails(groupId: string | number): Promise<RobloxGroupDetail | null> {
    if (this.outageNext) throw new Error("Roblox service outage (503)");
    if (this.rateLimitNext) throw new Error("Roblox 429 Too Many Requests");
    return this.groups.get(Number(groupId)) || null;
  }

  async getGroupRoles(groupId: string | number): Promise<RobloxGroupRoleItem[]> {
    if (this.outageNext || this.rateLimitNext) return [];
    return this.roles.get(Number(groupId)) || [];
  }

  async getGroupMembers(groupId: string | number): Promise<RobloxGroupMemberItem[]> {
    if (this.outageNext || this.rateLimitNext) return [];
    return this.members.get(Number(groupId)) || [];
  }

  async getUserGroupRank(robloxUserId: string | number, groupId: string | number): Promise<number> {
    if (this.outageNext || this.rateLimitNext) return 0;
    return this.userRanks.get(`${robloxUserId}_${groupId}`) || 0;
  }
}

// Default exported client instance
export const robloxGroupsClient: RobloxClientInterface = new RealRobloxGroupsClient();
