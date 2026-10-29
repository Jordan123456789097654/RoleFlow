import { verifySessionValue, SESSION_COOKIE_NAME } from "./session";
import { isFounderUser } from "./roles";
import { prisma } from "./prisma";
import { cookies } from "next/headers";

export const PARTNER_BADGE = "PARTNER";

/** Founder-only check for partnership decisions. Returns the founder's user ID, or null. */
export async function founderUserId(): Promise<string | null> {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, siteRole: true } });
  return user && isFounderUser(user) ? user.id : null;
}

/** Adds the Partner badge to a community, keeping any badges it already has. */
export function withPartnerBadge(current: string | null | undefined): { verifiedBadges: string; verifiedBadge: string } {
  const list = (current || "").split(",").map((b) => b.trim()).filter(Boolean);
  if (!list.includes(PARTNER_BADGE)) list.push(PARTNER_BADGE);
  return { verifiedBadges: list.join(","), verifiedBadge: list[0] };
}
