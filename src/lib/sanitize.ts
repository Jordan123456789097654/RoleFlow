/** Fields that must never leave the server in API responses. */
export function sanitizeGuild<T extends Record<string, any>>(guild: T, opts: { keepLicense?: boolean } = {}) {
  const { customBotToken, licenseKey, robloxCloudApiKey, ...rest } = guild;
  return {
    ...rest,
    hasCustomBotToken: Boolean(customBotToken),
    hasRobloxCloudApiKey: Boolean(robloxCloudApiKey),
    ...(opts.keepLicense ? { licenseKey } : {}),
  };
}

/** Safe public columns for a user embedded in another record (never passwordHash, email, 2FA, support codes). */
export const SAFE_USER_SELECT = {
  id: true,
  username: true,
  discriminator: true,
  avatar: true,
  robloxId: true,
  robloxUsername: true,
} as const;

export function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips Discord markdown-link and mention syntax from user-supplied text placed in embeds/messages. */
export function discordSafe(v: unknown, max = 200): string {
  return String(v ?? "")
    .replace(/[\[\]()<>@`]/g, "")
    .slice(0, max);
}
