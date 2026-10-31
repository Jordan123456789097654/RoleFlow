import { signToken, verifyToken } from "./signed-token";

const ROSTER_APPLYHUB_PURPOSE = "roster-applyhub-token";
const TOKEN_TTL_SECONDS = 300; // 5 minutes

export type RosterTokenPayload = {
  u: string; // RoleFlow User ID
  g: string; // Roster Group ID
};

/**
 * Mint a short-lived signed token from the Roster session to query ApplyHub
 */
export function mintRosterApplyHubToken(userId: string, groupId: string): string {
  return signToken(ROSTER_APPLYHUB_PURPOSE, { u: userId, g: groupId }, TOKEN_TTL_SECONDS);
}

/**
 * Verify an incoming short-lived token from Roster
 */
export function verifyRosterApplyHubToken(token: string | null | undefined): RosterTokenPayload | null {
  const verified = verifyToken<{ u: string; g: string }>(ROSTER_APPLYHUB_PURPOSE, token);
  if (!verified || typeof verified.u !== "string" || typeof verified.g !== "string") {
    return null;
  }
  return { u: verified.u, g: verified.g };
}
