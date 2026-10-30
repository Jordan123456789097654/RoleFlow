import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isFounderUser, isSiteAdminUser } from "@/lib/roles";

export type StaffCaller = { id: string; username: string; isFounder: boolean; isAdmin: boolean };

/** Support staff, site admins, and the founder may use the support workspace. */
export async function getSupportCaller(): Promise<StaffCaller | null> {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, isSupportStaff: true, isSiteAdmin: true, siteRole: true },
  });
  if (!u) return null;
  const isAdmin = isSiteAdminUser(u);
  if (!(u.isSupportStaff || isAdmin)) return null;
  return { id: u.id, username: u.username, isFounder: isFounderUser(u), isAdmin };
}

/** Only the founder may edit policies. */
export async function getFounderCaller(): Promise<StaffCaller | null> {
  const caller = await getSupportCaller();
  return caller?.isFounder ? caller : null;
}

/** Reviewing reports is limited to site administrators and the founder. */
export async function getAdminCaller(): Promise<StaffCaller | null> {
  const caller = await getSupportCaller();
  return caller?.isAdmin ? caller : null;
}
