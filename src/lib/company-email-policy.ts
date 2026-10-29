import { isFounderId, isSiteAdminUser } from "./roles";

/** Roles that must confirm a company email before using the site. */
const STAFF_ROLES = ["FOUNDER", "ADMIN", "MODERATOR", "SUPPORT", "STAFF"];

/** Founders, site admins, and every support or moderation role. Used by the page gate and the API. */
export function requiresCompanyEmail(u: {
  id?: string;
  isSiteAdmin?: boolean | null;
  isSupportStaff?: boolean | null;
  siteRole?: string | null;
}): boolean {
  return isSiteAdminUser(u) || Boolean(u.isSupportStaff) || STAFF_ROLES.includes(u.siteRole ?? "") || isFounderId(u.id);
}
