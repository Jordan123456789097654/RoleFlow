/**
 * Single source of truth for Roster access control and feature flag status.
 *
 * Status: UNRELEASED.
 * Default: ROSTER_ENABLED=false
 * When false, any user not present in ROSTER_ALLOWLIST_USER_IDS is refused with a 404.
 */

export interface RosterAccessInput {
  userId?: string | null;
  discordId?: string | null;
}

export function isRosterGloballyEnabled(): boolean {
  return process.env.ROSTER_ENABLED === "true";
}

export function rosterAllowlistUserIds(): Set<string> {
  const raw = process.env.ROSTER_ALLOWLIST_USER_IDS || "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(ids);
}

/**
 * Checks whether a given user has access to Roster.
 * Returns true if:
 * 1. ROSTER_ENABLED is "true"
 * 2. OR user's RoleFlow userId or discordId matches any entry in ROSTER_ALLOWLIST_USER_IDS
 */
export function canAccessRoster(user?: RosterAccessInput | null): boolean {
  if (isRosterGloballyEnabled()) {
    return true;
  }

  if (!user) {
    return false;
  }

  const allowlist = rosterAllowlistUserIds();
  if (allowlist.size === 0) {
    return false;
  }

  if (user.userId && allowlist.has(user.userId)) {
    return true;
  }

  if (user.discordId && allowlist.has(user.discordId)) {
    return true;
  }

  return false;
}
