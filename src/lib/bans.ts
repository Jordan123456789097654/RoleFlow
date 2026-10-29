import { prisma } from "./prisma";

/**
 * The one place that decides whether an account is banned from the platform.
 * Checks the global blacklist (Discord ID or Roblox username) and active bans and suspensions.
 */
export async function findActiveBan(opts: {
  discordId: string;
  robloxUsername?: string | null;
  robloxId?: string | null;
}): Promise<{ reason: string } | null> {
  const robloxTargets = [opts.robloxUsername, opts.robloxId].filter(Boolean) as string[];
  const blacklisted = await prisma.globalBlacklist.findFirst({
    where: {
      OR: [
        { targetType: "DISCORD_ID", targetValue: opts.discordId },
        ...robloxTargets.map((v) => ({
          targetType: "ROBLOX_ID",
          targetValue: { equals: v, mode: "insensitive" as const },
        })),
      ],
    },
  });
  if (blacklisted) return { reason: blacklisted.reason || "Policy violation" };

  const punishment = await prisma.punishment.findFirst({
    where: {
      targetType: "USER",
      targetId: opts.discordId,
      liftedAt: null,
      action: { in: ["BAN", "SUSPENSION"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (punishment) return { reason: punishment.reason };
  return null;
}

/** Keeps User.isBanned in step with the real ban state, so the banner and checks agree. */
export async function syncBanFlag(userId: string) {
  const [ban, blacklisted] = await Promise.all([
    prisma.punishment.findFirst({
      where: {
        targetType: "USER",
        targetId: userId,
        liftedAt: null,
        action: "BAN",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true },
    }),
    prisma.globalBlacklist.findFirst({ where: { targetType: "DISCORD_ID", targetValue: userId }, select: { id: true } }),
  ]);
  await prisma.user.updateMany({ where: { id: userId }, data: { isBanned: Boolean(ban || blacklisted) } });
}
