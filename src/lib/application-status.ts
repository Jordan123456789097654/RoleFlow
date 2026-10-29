import { prisma } from "./prisma";
import { BotDispatcher } from "./bot-dispatcher";
import { dispatchCommunityWebhook } from "./webhook-dispatcher";
import { sendApplicationStatusEmail } from "./email";
import { recordAudit } from "./audit";
import { isSiteAdminUser } from "./roles";
import { decryptSecret } from "./crypto";
import { setGroupMemberRank } from "./roblox";
import { logger } from "./logger";

export const STATUSES = ["PENDING", "UNDER_REVIEW", "INTERVIEW", "ACCEPTED", "REJECTED"] as const;
export type AppStatus = (typeof STATUSES)[number];

/**
 * Single code path for changing an application's status, used by the web dashboard
 * and by Discord button clicks. Sends the applicant email, bot actions, and webhook log.
 */
export async function changeApplicationStatus(args: {
  applicationId: string;
  status: AppStatus;
  decisionNote?: string | null;
  actorId: string;
  actorName: string;
}) {
  const application = await prisma.application.findUnique({
    where: { id: args.applicationId },
    include: { position: { include: { guild: true } }, user: true },
  });
  if (!application) return null;

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { status: args.status, decisionNote: args.decisionNote || application.decisionNote },
  });

  // Decision emails only cover ACCEPTED, REJECTED, INTERVIEW and UNDER_REVIEW. PENDING sends nothing.
  if (args.status !== "PENDING" && application.user.email && application.user.emailNotifications !== false) {
    try {
      await sendApplicationStatusEmail({
        toEmail: application.user.email,
        applicantName: application.user.username,
        communityName: application.position.guild.name,
        positionTitle: application.position.title,
        status: args.status,
        decisionNote: args.decisionNote,
        applicationId: application.id,
      });
    } catch (err) {
      console.error("Status update email sending failed:", err);
    }
  }

  // Roblox Open Cloud Auto-Ranking on ACCEPTED
  if (args.status === "ACCEPTED") {
    const guild = application.position.guild;
    const applicant = application.user;

    if (guild.robloxCloudApiKey && guild.robloxGroupId && guild.robloxAcceptRankId && applicant.robloxId) {
      try {
        const decryptedKey = decryptSecret(guild.robloxCloudApiKey);
        if (decryptedKey) {
          const rankResult = await setGroupMemberRank(
            guild.robloxGroupId,
            applicant.robloxId,
            guild.robloxAcceptRankId,
            decryptedKey
          );

          if (rankResult.success) {
            logger.info(`Auto-ranked applicant ${applicant.username} (Roblox: ${applicant.robloxId}) to rank/role ${guild.robloxAcceptRankId} in group ${guild.robloxGroupId}`);
            await recordAudit({
              actorId: args.actorId,
              action: "ROBLOX_AUTO_RANK_SUCCESS",
              targetId: application.id,
              details: {
                guildId: guild.id,
                robloxGroupId: guild.robloxGroupId,
                robloxUserId: applicant.robloxId,
                targetRank: guild.robloxAcceptRankId,
                roleId: rankResult.roleId,
              },
            });
          } else {
            logger.warn(`Failed auto-ranking applicant ${applicant.username} in group ${guild.robloxGroupId}: ${rankResult.error}`);
            await recordAudit({
              actorId: args.actorId,
              action: "ROBLOX_AUTO_RANK_FAILURE",
              targetId: application.id,
              details: {
                guildId: guild.id,
                robloxGroupId: guild.robloxGroupId,
                robloxUserId: applicant.robloxId,
                targetRank: guild.robloxAcceptRankId,
                error: rankResult.error,
              },
            });
          }
        }
      } catch (robloxErr: any) {
        logger.error("Roblox auto-ranking process exception:", { error: robloxErr?.message || String(robloxErr) });
      }
    }
  }

  await BotDispatcher.handleStatusChange({
    applicationId: application.id,
    guildId: application.position.guildId,
    applicantDiscordId: application.userId,
    positionTitle: application.position.title,
    newStatus: args.status,
    previousStatus: application.status,
    decisionNote: args.decisionNote ?? undefined,
    reviewedByUsername: args.actorName,
  });

  await dispatchCommunityWebhook({
    guildId: application.position.guildId,
    event: "STATUS_UPDATE",
    title: `Application ${args.status}: ${application.position.title}`,
    description: `**Applicant:** ${application.user.username} (<@${application.userId}>)\n**Status:** \`${args.status}\`\n**Reviewed By:** ${args.actorName}${args.decisionNote ? `\n**Note:** ${args.decisionNote}` : ""}`,
  });

  await recordAudit({
    actorId: args.actorId,
    action: "APPLICATION_STATUS_CHANGE",
    targetId: application.id,
    details: { status: args.status, decisionNote: args.decisionNote ?? null, via: "status" },
  });

  return updated;
}

/** Owner, site admin, or any staff member. Used for read-only staff commands. */
export async function canViewInGuild(guildId: string, userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  if (user && isSiteAdminUser(user)) return true;
  const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { ownerId: true } });
  if (guild?.ownerId === userId) return true;
  const staff = await prisma.guildStaff.findUnique({ where: { guildId_userId: { guildId, userId } }, select: { id: true } });
  return !!staff;
}

/** Owner, site admin, or staff with a decision permission. Used for Discord button clicks. */
export async function canDecideInGuild(guildId: string, userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  if (user && isSiteAdminUser(user)) return true;
  const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { ownerId: true } });
  if (guild?.ownerId === userId) return true;
  const staff = await prisma.guildStaff.findUnique({
    where: { guildId_userId: { guildId, userId } },
    select: { permissions: true },
  });
  return !!staff && ["full_decision", "position_editor"].includes(staff.permissions);
}
