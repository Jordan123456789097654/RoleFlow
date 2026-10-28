import { prisma } from "./prisma";
import { BotDispatcher } from "./bot-dispatcher";
import { dispatchCommunityWebhook } from "./webhook-dispatcher";
import { sendApplicationStatusEmail } from "./email";
import { recordAudit } from "./audit";
import { isSiteAdminUser } from "./roles";

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

  if (application.user.email && application.user.emailNotifications !== false) {
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

  await BotDispatcher.handleStatusChange({
    applicationId: application.id,
    guildId: application.position.guildId,
    applicantDiscordId: application.userId,
    positionTitle: application.position.title,
    newStatus: args.status,
    decisionNote: args.decisionNote ?? undefined,
    reviewedByUsername: args.actorName,
  });

  await dispatchCommunityWebhook({
    guildId: application.position.guildId,
    event: "STATUS_UPDATE",
    title: `⚖️ Application ${args.status}: ${application.position.title}`,
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
