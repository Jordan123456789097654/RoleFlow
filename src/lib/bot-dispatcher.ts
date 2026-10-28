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
 * Dispatches Discord actions using either the Community's Custom Bot token or the Global AppliBot token.
 */
export class BotDispatcher {
  /**
   * Retrieves the active token for the guild (custom token if enabled, otherwise global token)
   */
  private static async getBotTokenForGuild(guildId: string): Promise<{ token: string | null; isCustom: boolean }> {
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      select: { useCustomBot: true, customBotToken: true },
    });

    if (guild?.useCustomBot && guild.customBotToken) {
      return { token: guild.customBotToken, isCustom: true };
    }

    return { token: process.env.DISCORD_BOT_TOKEN || null, isCustom: false };
  }

  /**
   * Sends an application notification embed into the community's configured staff channel
   */
  static async sendApplicationAlert(params: SendApplicationAlertParams): Promise<boolean> {
    try {
      const guild = await prisma.guild.findUnique({
        where: { id: params.guildId },
        select: { logChannelId: true, name: true, embedColor: true, staffPingRoleId: true },
      });

      if (!guild?.logChannelId) {
        console.log(`[BotDispatcher] No staff log channel set for guild ${params.guildId}. Skipping embed.`);
        return false;
      }

      const { token, isCustom } = await this.getBotTokenForGuild(params.guildId);
      if (!token || token.includes("your_discord_bot_token")) {
        console.log(`[BotDispatcher] [Dev Mode] Application alert simulated for ${params.applicantUsername} (${params.positionTitle})`);
        return true;
      }

      const webReviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/${params.guildId}?appId=${params.applicationId}`;

      const fields = params.summaryAnswers.slice(0, 4).map((ans) => ({
        name: ans.label.length > 250 ? ans.label.slice(0, 247) + "..." : ans.label,
        value: ans.value.length > 1024 ? ans.value.slice(0, 1020) + "..." : ans.value || "*(Not provided)*",
        inline: false,
      }));

      if (params.robloxUsername) {
        fields.unshift({
          name: "Roblox Identity",
          value: `👤 [${params.robloxUsername}](https://www.roblox.com/search/users?keyword=${params.robloxUsername})`,
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
        title: `📥 New Application: ${params.positionTitle}`,
        description: `**Applicant:** <@${params.applicantDiscordId}> (\`${params.applicantUsername}\`)\n**Community:** ${guild.name}\n**Status:** ⏳ Pending Staff Review`,
        color: colorInt,
        thumbnail: params.applicantAvatar ? { url: params.applicantAvatar } : undefined,
        fields,
        footer: {
          text: isCustom ? `${guild.name} Staff Portal` : "RoleFlow Application System",
        },
        timestamp: new Date().toISOString(),
      };

      const components = [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 5, // Link
              label: "Review on RoleFlow",
              url: webReviewUrl,
              emoji: { name: "🌐" },
            },
            {
              type: 2,
              style: 3, // Success / Green
              label: "Quick Accept",
              custom_id: `quick_accept_${params.applicationId}`,
              emoji: { name: "✅" },
            },
            {
              type: 2,
              style: 4, // Danger / Red
              label: "Quick Reject",
              custom_id: `quick_reject_${params.applicationId}`,
              emoji: { name: "❌" },
            },
          ],
        },
      ];

      const res = await fetch(`https://discord.com/api/v10/channels/${guild.logChannelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: guild.staffPingRoleId ? `🔔 <@&${guild.staffPingRoleId}> New candidate submission!` : undefined,
          embeds: [embed],
          components,
        }),
      });

      return res.ok;
    } catch (err) {
      console.error("[BotDispatcher] Failed to send application alert:", err);
      return false;
    }
  }

  /**
   * Handles status updates (Accept role assignment, DMs to user, Interview channels)
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

      if (!guild) return;

      const { token } = await this.getBotTokenForGuild(params.guildId);
      if (!token || token.includes("your_discord_bot_token")) {
        console.log(`[BotDispatcher] [Dev Mode] Status change simulated: ${params.applicantDiscordId} -> ${params.newStatus}`);
        return;
      }

      // 1. If ACCEPTED: Assign Discord Role automatically
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
          console.log(`[BotDispatcher] Role ${targetPosition.acceptRoleId} granted to <@${params.applicantDiscordId}>`);
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
            // Save thread ID to application
            await prisma.application.update({
              where: { id: params.applicationId },
              data: { interviewChannelId: threadData.id },
            });

            // Post greeting in the interview thread
            await fetch(`https://discord.com/api/v10/channels/${threadData.id}/messages`, {
              method: "POST",
              headers: {
                Authorization: `Bot ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                content: `👋 Welcome <@${params.applicantDiscordId}>! Your application for **${params.positionTitle}** has advanced to the **Interview** stage.\nStaff will be with you shortly.`,
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
            ACCEPTED: 0x10b981, // Emerald Green
            REJECTED: 0xf43f5e, // Crimson Rose
            INTERVIEW: 0x06b6d4, // Cyan
            UNDER_REVIEW: 0xf59e0b, // Amber
          };

          const statusTitles: Record<string, string> = {
            ACCEPTED: "🎉 Application Accepted!",
            REJECTED: "Update on your application",
            INTERVIEW: "📅 Interview Invitation",
            UNDER_REVIEW: "👀 Application is Under Review",
          };

          const dmEmbed = {
            title: statusTitles[params.newStatus] || "Application Status Update",
            description: `Your application for **${params.positionTitle}** in **${guild.name}** has been updated to **${params.newStatus}**.`,
            color: statusColors[params.newStatus] || 0x8b5cf6,
            fields: params.decisionNote
              ? [{ name: "Note from Staff", value: params.decisionNote }]
              : [],
            footer: { text: "RoleFlow Application System" },
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
        console.log(`[BotDispatcher] Could not DM user <@${params.applicantDiscordId}> (DMs might be closed).`);
      }
    } catch (err) {
      console.error("[BotDispatcher] Error handling status change:", err);
    }
  }
}
