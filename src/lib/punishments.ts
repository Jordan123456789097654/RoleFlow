import { prisma } from "./prisma";
import { recordAudit } from "./audit";
import { sendModerationNoticeEmail, sendSecurityNoticeEmail } from "./email";
import { signSessionValue } from "./session";
import { platformOrigin } from "./platform-origin";
import { syncBanFlag } from "./bans";

const APP_URL = platformOrigin();

/** Warns, suspends, or bans a user. Bans and suspensions end all their sessions and email an appeal link. */
export async function punishUser(a: {
  userId: string;
  action: "WARNING" | "SUSPENSION" | "BAN";
  reason: string;
  days?: number | null;
  issuedById: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: a.userId },
    select: { id: true, username: true, email: true, emailNotifications: true },
  });
  if (!user) throw new Error("User not found");

  const expiresAt = a.action === "SUSPENSION" && a.days ? new Date(Date.now() + a.days * 86_400_000) : null;
  const punishment = await prisma.punishment.create({
    data: { targetType: "USER", targetId: user.id, action: a.action, reason: a.reason, expiresAt, issuedById: a.issuedById },
  });

  if (a.action !== "WARNING") {
    await prisma.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  }

  if (a.action === "BAN") await syncBanFlag(user.id);

  await recordAudit({
    actorId: a.issuedById,
    action: "USER_PUNISH",
    targetId: user.id,
    details: { punishmentId: punishment.id, action: a.action, reason: a.reason, days: a.days ?? null },
  });

  if (user.email && user.emailNotifications !== false) {
    await sendModerationNoticeEmail({
      toEmail: user.email,
      username: user.username,
      actionType: a.action,
      reason: a.reason,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    });
    if (a.action !== "WARNING") {
      const token = signSessionValue(punishment.id, 0);
      await sendSecurityNoticeEmail({
        toEmail: user.email,
        username: user.username,
        heading: "You can appeal this decision",
        message: `If you believe this was a mistake, you can appeal here: ${APP_URL}/appeal?token=${token}`,
      });
    }
  }
  return punishment;
}

export async function liftUserPunishments(userId: string, liftedById: string) {
  const result = await prisma.punishment.updateMany({
    where: { targetType: "USER", targetId: userId, liftedAt: null, action: { in: ["BAN", "SUSPENSION"] } },
    data: { liftedAt: new Date() },
  });
  await syncBanFlag(userId);
  await recordAudit({ actorId: liftedById, action: "USER_PUNISH_LIFT", targetId: userId, details: { lifted: result.count } });
  return result.count;
}

/** Pauses, unpauses, or blacklists a community. */
export async function applyGuildAction(a: {
  guildId: string;
  action: "PAUSE" | "UNPAUSE" | "BLACKLIST";
  reason?: string;
  issuedById: string;
}) {
  const guild = await prisma.guild.findUnique({ where: { id: a.guildId }, select: { id: true, name: true } });
  if (!guild) return null;

  if (a.action === "UNPAUSE") {
    await prisma.guild.update({ where: { id: guild.id }, data: { isPaused: false } });
    await prisma.punishment.updateMany({
      where: { targetType: "GUILD", targetId: guild.id, liftedAt: null },
      data: { liftedAt: new Date() },
    });
  } else {
    await prisma.guild.update({ where: { id: guild.id }, data: { isPaused: true } });
    await prisma.punishment.create({
      data: {
        targetType: "GUILD",
        targetId: guild.id,
        action: a.action,
        reason: a.reason || "Policy violation",
        issuedById: a.issuedById,
      },
    });
  }

  await recordAudit({ actorId: a.issuedById, action: `GUILD_${a.action}`, targetId: guild.id, details: { reason: a.reason ?? null } });
  return guild;
}
