import { logEvent } from "./health";
import { prisma } from "./prisma";

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
  decisionNote?: string;
  reviewedByUsername?: string;
}

/**
 * Dispatches automated Discord actions directly via Discord REST API using the community's custom bot token.
 * If the community chooses "No Bot", actions are safely skipped.
 */
export class BotDispatcher {
  /**
   * Sends an application notification embed into the community's configured staff channel using their custom bot token.
   */
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

      // Determine bot token to use: custom bot if enabled and provided, otherwise official bot token
      const token = (guild?.useCustomBot && guild?.customBotToken?.trim())
        ? guild.customBotToken.trim()
        : process.env.DISCORD_BOT_TOKEN?.trim();

      if (!token || !guild?.logChannelId) {
        console.log(`[BotDispatcher] No bot token or log channel for guild ${params.guildId}. Skipping alert.`);
        return true;
      }
      const webReviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://roleflow.site"}/dashboard/${params.guildId}`;

      const fields = params.summaryAnswers.slice(0, 4).map((ans) => ({
        name: ans.label.length > 250 ? ans.label.slice(0, 247) + "..." : ans.label,
        value: ans.value.length > 1024 ? ans.value.slice(0, 1020) + "..." : ans.value || "*(Not provided)*",
        inline: false,
      }));

      if (params.robloxUsername) {
        fields.unshift({
          name: "Roblox Identity",
          value: `[${params.robloxUsername}](https://www.roblox.com/search/users?keyword=${params.robloxUsername})`,
          inline: true,
        });
      }

      // Parse custom hex color
      let colorInt = 0x8b5cf6;
      if (guild.embedColor) {
        try {
          const cleanHex = guild.embedColor.replace("#", "");
          colorInt = parseInt(cleanHex, 16);
        } catch (e) {}
      }

      const embed = {
        title: `New Application: ${params.positionTitle}`,
        description: `**Applicant:** <@${params.applicantDiscordId}> (\`${params.applicantUsername}\`)\n**Community:** ${guild.name}\n**Status:** ⏳ Pending Staff Review`,
        color: colorInt,
        thumbnail: params.applicantAvatar ? { url: params.applicantAvatar } : undefined,
        fields,
        footer: {
          text: `${guild.name} • RoleFlow`,
        },
        timestamp: new Date().toISOString(),
      };

      const linkButton = { type: 2, style: 5, label: "Review on RoleFlow", url: webReviewUrl };
      const quickButtons = guild.useCustomBot
        ? []
        : [
            { type: 2, style: 3, label: "Quick Accept", custom_id: `rf:accept:${params.applicationId}` },
            { type: 2, style: 4, label: "Quick Reject", custom_id: `rf:reject:${params.applicationId}` },
          ];
      const components = [{ type: 1, components: [linkButton, ...quickButtons] }];

      const res = await fetch(`https://discord.com/api/v10/channels/${guild.logChannelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: guild.staffPingRoleId ? `<@&${guild.staffPingRoleId}> New candidate submission!` : undefined,
          embeds: [embed],
          components,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        await logEvent("ERROR", "bot", `Alert for application ${params.applicationId} failed: ${res.status} ${body.slice(0, 200)}`);
      }
      return res.ok;
    } catch (err) {
      console.error("[BotDispatcher] Failed to send application alert:", err);
      await logEvent("ERROR", "bot", `Alert for application ${params.applicationId} threw: ${String(err).slice(0, 200)}`);
      return false;
    }
  }

  /**
   * Handles status updates (Accept role assignment, DMs to applicant, Interview tickets)
   */
  static async handleStatusChange(params: StatusChangeParams): Promise<void> {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: params.guildId },
        include: {
          positions: {
            where: { title: params.positionTitle },
          },
        },
      });

      const token = (guild?.useCustomBot && guild?.customBotToken?.trim())
        ? guild.customBotToken.trim()
        : process.env.DISCORD_BOT_TOKEN?.trim();

      if (!guild || !token) {
        return; // No guild or bot token available
      }

      // 1. If ACCEPTED: Assign Discord Role automatically using their bot token
      const targetPosition = guild.positions[0];
      if (params.newStatus === "ACCEPTED" && targetPosition?.acceptRoleId) {
        try {
          await fetch(
            `https://discord.com/api/v10/guilds/${params.guildId}/members/${params.applicantDiscordId}/roles/${targetPosition.acceptRoleId}`,
            {
              method: "PUT",
              headers: { Authorization: `Bot ${token}` },
            }
          );
          console.log(`[BotDispatcher] Auto-assigned role ${targetPosition.acceptRoleId} to user ${params.applicantDiscordId}`);
        } catch (err) {
          console.error("[BotDispatcher] Error assigning role:", err);
        }
      }

      // 2. If INTERVIEW: Create automated private interview thread or channel
      if (params.newStatus === "INTERVIEW" && guild.enableInterviewAutoChannel && guild.logChannelId) {
        try {
          const threadRes = await fetch(`https://discord.com/api/v10/channels/${guild.logChannelId}/threads`, {
            method: "POST",
            headers: {
              Authorization: `Bot ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: `interview-${params.applicationId.slice(-6)}`,
              auto_archive_duration: 1440,
              type: 11, // Public/Private Thread
            }),
          });

          if (threadRes.ok) {
            const threadData = (await threadRes.json()) as { id: string };
            await prisma.application.update({
              where: { id: params.applicationId },
              data: { interviewChannelId: threadData.id },
            });

            await fetch(`https://discord.com/api/v10/channels/${threadData.id}/messages`, {
              method: "POST",
              headers: {
                Authorization: `Bot ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content: `Welcome <@${params.applicantDiscordId}>! Your application for **${params.positionTitle}** has advanced to the **Interview** stage.\nStaff will be with you shortly.`,
              }),
            });
          }
        } catch (err) {
          console.error("[BotDispatcher] Error creating interview thread:", err);
        }
      }

      // 3. Send Direct Message to applicant with status update
      try {
        const dmChannelRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
          method: "POST",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipient_id: params.applicantDiscordId }),
        });

        if (dmChannelRes.ok) {
          const dmData = (await dmChannelRes.json()) as { id: string };
          const statusColors: Record<string, number> = {
            ACCEPTED: 0x10b981,
            REJECTED: 0xf43f5e,
            INTERVIEW: 0x06b6d4,
            UNDER_REVIEW: 0xf59e0b,
          };

          const statusTitles: Record<string, string> = {
            ACCEPTED: "Application Accepted!",
            REJECTED: "Update on your application",
            INTERVIEW: "Interview Invitation",
            UNDER_REVIEW: "👀 Application is Under Review",
          };

          const dmEmbed = {
            title: statusTitles[params.newStatus] || "Application Status Update",
            description: `Your application for **${params.positionTitle}** in **${guild.name}** has been updated to **${params.newStatus}**.`,
            color: statusColors[params.newStatus] || 0x8b5cf6,
            fields: params.decisionNote
              ? [{ name: "Note from Staff", value: params.decisionNote }]
              : [],
            footer: { text: `${guild.name} • RoleFlow` },
            timestamp: new Date().toISOString(),
          };

          await fetch(`https://discord.com/api/v10/channels/${dmData.id}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bot ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ embeds: [dmEmbed] }),
          });
        }
      } catch (err) {
        console.log(`[BotDispatcher] Could not DM user <@${params.applicantDiscordId}>.`);
      }
    } catch (err) {
      console.error("[BotDispatcher] Error handling status change:", err);
    }
  }
}
