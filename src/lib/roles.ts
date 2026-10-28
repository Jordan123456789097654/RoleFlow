export const FOUNDER_ID = "1046538179399929957";

/** Site-wide admin permissions: founder, admins, or the DB admin flag. */
export function isSiteAdminUser(u: { id?: string; isSiteAdmin?: boolean | null; siteRole?: string | null }): boolean {
  return Boolean(u.isSiteAdmin) || u.siteRole === "FOUNDER" || u.siteRole === "ADMIN" || u.id === FOUNDER_ID;
}

export function isFounderUser(u: { id?: string; siteRole?: string | null }): boolean {
  return u.siteRole === "FOUNDER" || u.id === FOUNDER_ID;
}
