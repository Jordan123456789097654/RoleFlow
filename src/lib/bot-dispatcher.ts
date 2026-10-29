import { logEvent } from "./health";
import { decryptSecret } from "./crypto";
import { discordSafe } from "./sanitize";
import { prisma } from "./prisma";
import { platformOrigin } from "./platform-origin";
import { discordFetch } from "./discord-api";
import { enqueueOrSend, sendEmailFallback, type EmailFallback } from "./bot-outbox";

interface SendApplicationAlertParams {
  applicationId: string;
  guildId: string;
  positionTitle: string;
  applicantDiscordId: string;
  applicantUsername: string;
  applicantAvatar?: string | null;
  robloxUsername?: string | null;
  summaryAnswers: Array<{ label: string; value: string }>;
}

interface StatusChangeParams {
  applicationId: string;
  guildId: string;
  applicantDiscordId: string;
  positionTitle: string;
  newStatus: "PENDING" | "UNDER_REVIEW" | "INTERVIEW" | "ACCEPTED" | "REJECTED";
  previousStatus?: string;
  decisionNote?: string;
  reviewedByUsername?: string;
}

const STATUS_COLORS: Record<string, number> = {
  ACCEPTED: 0x10b981,
  REJECTED: 0xf43f5e,
  INTERVIEW: 0x06b6d4,
  UNDER_REVIEW: 0xf59e0b,
};

const STATUS_TITLES: Record<string, string> = {
  ACCEPTED: "Application Accepted!",
  REJECTED: "Update on your application",
  INTERVIEW: "Interview Invitation",
  UNDER_REVIEW: "👀 Application is Under Review",
};

/**
 * Sends automated Discord actions through the community's own bot token.
 * Rate limits are retried, failed alerts and DMs are queued, and applicants are emailed if a DM can't be delivered.
 * Communities without a bot get no Discord actions.
 */
export class BotDispatcher {
  /** Posts the application embed to the community's staff log channel. */
  static async sendApplicationAlert(params: SendApplicationAlertParams): Promise<boolean> {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: params.guildId },
        select: {
          logChannelId: true,
          name: true,
          embedColor: true,
          staffPingRoleId: true,
          useCustomBot: true,
          customBotToken: true,
        },
      });

      const token = guild?.useCustomBot && guild?.customBotToken?.trim() ? decryptSecret(guild.customBotToken) : null;
      if (!token || !guild?.logChannelId) {
        console.log(`[BotDispatcher] No bot token or log channel for guild ${params.guildId}. Skipping alert.`);
        return true;
      }

      const webReviewUrl = `${platformOrigin()}/dashboard/${params.guildId}`;

      const fields = params.summaryAnswers.slice(0, 4).map((ans) => ({
        name: ans.label.length > 250 ? ans.label.slice(0, 247) + "..." : ans.label,
        value: ans.value.length > 1024 ? ans.value.slice(0, 1020) + "..." : ans.value || "*(Not provided)*",
        inline: false,
      }));

      if (params.robloxUsername) {
        fields.unshift({
          name: "Roblox Identity",
          value: `[${discordSafe(params.robloxUsername, 40)}](https://www.roblox.com/search/users?keyword=${encodeURIComponent(String(params.robloxUsername).slice(0, 40))})`,
          inline: true,
        });
      }

      let colorInt = 0x8b5cf6;
      if (guild.embedColor) {
        const parsed = parseInt(guild.embedColor.replace("#", ""), 16);
        if (!Number.isNaN(parsed)) colorInt = parsed;
      }

      const embed = {
        title: `New Application: ${params.positionTitle}`,
        description: `**Applicant:** <@${params.applicantDiscordId}> (\`${params.applicantUsername}\`)\n**Community:** ${guild.name}\n**Status:** ⏳ Pending Staff Review`,
        color: colorInt,
        thumbnail: params.applicantAvatar ? { url: params.applicantAvatar } : undefined,
        fields,
        footer: { text: `${guild.name} • RoleFlow` },
        timestamp: new Date().toISOString(),
      };

      const linkButton = { type: 2, style: 5, label: "Review on RoleFlow", url: webReviewUrl };
      const quickButtons = [
        { type: 2, style: 3, label: "Quick Accept", custom_id: `rf:accept:${params.applicationId}` },
        { type: 2, style: 4, label: "Quick Reject", custom_id: `rf:reject:${params.applicationId}` },
      ];
      const components = [{ type: 1, components: [linkButton, ...quickButtons] }];

      const result = await enqueueOrSend({
        guildId: params.guildId,
        token,
        kind: "ALERT",
        key: `alert:${params.applicationId}`,
        method: "POST",
        path: `/channels/${guild.logChannelId}/messages`,
        body: {
          content: guild.staffPingRoleId ? `<@&${guild.staffPingRoleId}> New candidate submission!` : undefined,
          // Only the configured staff role may be pinged. Applicant text can never trigger @everyone or @here.
          allowed_mentions: { parse: [], roles: guild.staffPingRoleId ? [guild.staffPingRoleId] : [] },
          embeds: [embed],
          components,
        },
      });

      if (!result.ok) {
        await logEvent(
          "ERROR",
          "bot",
          `Alert for application ${params.applicationId} failed: ${result.status} ${result.error ?? ""}`.slice(0, 300)
        );
      }
      return result.ok || result.retryable; // retryable means it's queued and will be retried
    } catch (err) {
      console.error("[BotDispatcher] Failed to send application alert:", err);
      await logEvent("ERROR", "bot", `Alert for application ${params.applicationId} threw: ${String(err).slice(0, 200)}`);
      return false;
    }
  }

  /** Runs the actions for a status change: role grants, interview channel, and the applicant DM. */
  static async handleStatusChange(params: StatusChangeParams): Promise<void> {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: params.guildId },
        include: { positions: { where: { title: params.positionTitle } } },
      });
      const token = guild?.useCustomBot && guild?.customBotToken?.trim() ? decryptSecret(guild.customBotToken) : null;
      if (!guild || !token) return;

      const targetPosition = guild.positions[0];
      const roleId = targetPosition?.acceptRoleId;

      // 1. Accepted: grant the acceptance role.
      if (params.newStatus === "ACCEPTED" && roleId) {
        const r = await discordFetch(token, "PUT", `/guilds/${params.guildId}/members/${params.applicantDiscordId}/roles/${roleId}`);
        if (!r.ok) console.error(`[BotDispatcher] Could not assign role ${roleId}: ${r.status} ${r.error ?? ""}`);
      }

      // 1b. An accepted application that was reversed: remove the role.
      if (params.previousStatus === "ACCEPTED" && params.newStatus !== "ACCEPTED" && roleId) {
        const r = await discordFetch(token, "DELETE", `/guilds/${params.guildId}/members/${params.applicantDiscordId}/roles/${roleId}`);
        if (!r.ok) console.error(`[BotDispatcher] Could not remove role ${roleId}: ${r.status} ${r.error ?? ""}`);
      }

      // 2. Interview: create a private thread (and optionally a voice channel).
      if (params.newStatus === "INTERVIEW" && guild.enableInterviewAutoChannel && guild.logChannelId) {
        await this.createInterviewThread(params, guild, token);
      }

      // 3. Tell the applicant.
      await this.sendStatusDm(params, guild, token);
    } catch (err) {
      console.error("[BotDispatcher] Error handling status change:", err);
    }
  }

  private static async createInterviewThread(
    params: StatusChangeParams,
    guild: { logChannelId: string | null; interviewVoice: boolean; interviewCatId: string | null; name: string },
    token: string
  ) {
    try {
      const thread = await discordFetch(token, "POST", `/channels/${guild.logChannelId}/threads`, {
        name: `interview-${params.applicationId.slice(-6)}`,
        auto_archive_duration: 1440,
        type: 11,
      });
      if (!thread.ok || !thread.data?.id) return;
      const threadId = thread.data.id as string;

      await prisma.application.update({ where: { id: params.applicationId }, data: { interviewChannelId: threadId } });

      await discordFetch(token, "POST", `/channels/${threadId}/messages`, {
        content: `Welcome <@${params.applicantDiscordId}>! Your application for **${discordSafe(params.positionTitle, 100)}** has advanced to the **Interview** stage.\nStaff will be with you shortly.`,
        allowed_mentions: { parse: [], users: [params.applicantDiscordId] },
      });

      if (guild.interviewVoice && guild.interviewCatId) {
        const VIEW_CONNECT = String(BigInt(1024) | BigInt(1048576));
        const overwrites: Array<{ id: string; type: number; allow?: string; deny?: string }> = [
          { id: params.guildId, type: 0, deny: VIEW_CONNECT },
          { id: params.applicantDiscordId, type: 1, allow: VIEW_CONNECT },
        ];
        const reviewer = await prisma.guild.findUnique({ where: { id: params.guildId }, select: { reviewerRoleId: true } });
        if (reviewer?.reviewerRoleId) overwrites.push({ id: reviewer.reviewerRoleId, type: 0, allow: VIEW_CONNECT });

        const voice = await discordFetch(token, "POST", `/guilds/${params.guildId}/channels`, {
          name: `interview-${params.applicationId.slice(-6)}`,
          type: 2,
          parent_id: guild.interviewCatId,
          permission_overwrites: overwrites,
        });
        if (voice.ok && voice.data?.id) {
          await discordFetch(token, "POST", `/channels/${threadId}/messages`, {
            content: `Voice channel for the interview: <#${voice.data.id}>`,
            allowed_mentions: { parse: [] },
          });
        }
      }
    } catch (err) {
      console.error("[BotDispatcher] Error creating interview thread:", err);
    }
  }

  private static async sendStatusDm(
    params: StatusChangeParams,
    guild: { name: string },
    token: string
  ) {
    const status = params.newStatus;
    if (status === "PENDING") return;

    // Email the applicant if the DM can't be delivered (closed DMs, or a Discord outage that outlasts retries).
    const app = await prisma.application.findUnique({
      where: { id: params.applicationId },
      select: { user: { select: { email: true, username: true, emailNotifications: true } } },
    });
    const fallback: EmailFallback | undefined =
      app?.user?.email && app.user.emailNotifications
        ? {
            toEmail: app.user.email,
            applicantName: app.user.username,
            communityName: guild.name,
            positionTitle: params.positionTitle,
            status,
            decisionNote: params.decisionNote ?? null,
            applicationId: params.applicationId,
          }
        : undefined;

    const dm = await discordFetch(token, "POST", "/users/@me/channels", { recipient_id: params.applicantDiscordId });
    if (!dm.ok || !dm.data?.id) {
      await sendEmailFallback(fallback);
      return;
    }

    const embed = {
      title: STATUS_TITLES[status] || "Application Status Update",
      description: `Your application for **${params.positionTitle}** in **${guild.name}** has been updated to **${status}**.`,
      color: STATUS_COLORS[status] || 0x8b5cf6,
      fields: params.decisionNote ? [{ name: "Note from Staff", value: params.decisionNote }] : [],
      footer: { text: `${guild.name} • RoleFlow` },
      timestamp: new Date().toISOString(),
    };

    await enqueueOrSend({
      guildId: params.guildId,
      token,
      kind: "DM",
      key: `dm:${params.applicationId}:${status}:${Date.now()}`,
      method: "POST",
      path: `/channels/${dm.data.id}/messages`,
      body: { embeds: [embed], allowed_mentions: { parse: [] } },
      fallback,
    });
  }
}
