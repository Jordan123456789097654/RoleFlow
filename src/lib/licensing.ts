import { prisma } from "./prisma";

export const PAID_TIERS = ["PRO", "ENTERPRISE", "LIFETIME"];

/** Free-tier limits. Only apply while licensing is enabled. */
export const LIMITS = {
  freeOpenPositions: 3,
  freeCommunitiesPerUser: 1,
  paidCommunitiesPerUser: 5,
};

/**
 * Founder switch. Off (the default during beta) means every community and account has
 * paid features for free. On means the limits above apply and license keys unlock paid tiers.
 */
export async function isLicensingEnabled(): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({ where: { key: "licensing_enabled" } });
  return row?.value === "true";
}

function isActivePaid(tier: string, expiresAt: Date | null): boolean {
  if (!PAID_TIERS.includes(tier)) return false;
  return tier === "LIFETIME" || !expiresAt || expiresAt > new Date();
}

export async function isGuildPaid(guildId: string): Promise<boolean> {
  if (!(await isLicensingEnabled())) return true;
  const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { plan: true, planExpiresAt: true } });
  return !!guild && isActivePaid(guild.plan, guild.planExpiresAt);
}

export async function isUserPaid(userId: string): Promise<boolean> {
  if (!(await isLicensingEnabled())) return true;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, planExpiresAt: true } });
  return !!user && isActivePaid(user.plan, user.planExpiresAt);
}

/** How many communities this account may own. Infinity while licensing is off. */
export async function communityLimit(userId: string): Promise<number> {
  if (!(await isLicensingEnabled())) return Infinity;
  return (await isUserPaid(userId)) ? LIMITS.paidCommunitiesPerUser : LIMITS.freeCommunitiesPerUser;
}
