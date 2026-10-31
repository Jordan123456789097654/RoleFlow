/**
 * Strict Guild Isolation Guard (Section 0 & Section 3).
 *
 * Rules:
 * - This bot is strictly for the internal RoleFlow community server.
 * - Any command, interaction, or event originating from any guild OTHER than ROLEFLOW_SERVER_ID
 *   is immediately rejected, logged, and triggers an automatic guild departure (`guild.leave()`).
 */

export interface GuildLike {
  id: string;
  name?: string;
  leave: () => Promise<any>;
}

export type GuardResult =
  | { allowed: true; reason?: undefined }
  | { allowed: false; reason: "FOREIGN_GUILD"; foreignGuildId: string };

/**
 * Pure evaluation function: Checks if a guild ID matches the authorized RoleFlow server.
 */
export function isAuthorizedGuild(
  guildId: string | null | undefined,
  authorizedRoleflowServerId: string
): boolean {
  if (!guildId) return false;
  return guildId === authorizedRoleflowServerId;
}

/**
 * Guard runner: Evaluates the guild, logs any intrusion attempt, and automatically leaves foreign servers.
 */
export async function enforceGuildGuard(
  guild: GuildLike | null | undefined,
  authorizedRoleflowServerId: string,
  logger: { warn: (msg: string, meta?: any) => void; info: (msg: string, meta?: any) => void } = console
): Promise<GuardResult> {
  // Direct messages (no guild) are evaluated separately by modmail
  if (!guild) {
    return { allowed: true };
  }

  if (guild.id !== authorizedRoleflowServerId) {
    logger.warn(`[SECURITY ALERT] Received event from unauthorized guild "${guild.name || "Unknown"}" (${guild.id}). Expected "${authorizedRoleflowServerId}". Leaving immediately.`);
    try {
      await guild.leave();
      logger.info(`[SECURITY] Successfully departed unauthorized guild (${guild.id}).`);
    } catch (err: any) {
      logger.warn(`[SECURITY ERROR] Failed to leave unauthorized guild (${guild.id}): ${err?.message}`);
    }

    return { allowed: false, reason: "FOREIGN_GUILD", foreignGuildId: guild.id };
  }

  return { allowed: true };
}
