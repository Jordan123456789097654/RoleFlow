/**
 * Founder IDs come from the environment, never from source code.
 * Set FOUNDER_DISCORD_IDS (comma separated); falls back to SITE_ADMIN_DISCORD_IDS.
 */
export function isFounderId(id: string | null | undefined): boolean {
  if (!id) return false;
  const raw = process.env.FOUNDER_DISCORD_IDS || process.env.SITE_ADMIN_DISCORD_IDS || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean).includes(id);
}

/** Site-wide admin permissions: founder, admins, or the DB admin flag. */
export function isSiteAdminUser(u: { id?: string; isSiteAdmin?: boolean | null; siteRole?: string | null }): boolean {
  return Boolean(u.isSiteAdmin) || u.siteRole === "FOUNDER" || u.siteRole === "ADMIN" || isFounderId(u.id);
}

export function isFounderUser(u: { id?: string; siteRole?: string | null }): boolean {
  return u.siteRole === "FOUNDER" || isFounderId(u.id);
}
