import { prisma } from "./prisma";

interface WebhookPayload {
  guildId: string;
  event: "SUBMISSION" | "STATUS_UPDATE" | "REVIEW";
  title: string;
  description: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export async function dispatchCommunityWebhook(payload: WebhookPayload) {
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: payload.guildId },
      select: { webhookUrl: true, name: true, icon: true },
    });

    if (!guild || !guild.webhookUrl) return;

    const webhookUrl = guild.webhookUrl.trim();
    try {
      const u = new URL(webhookUrl);
      if (u.protocol !== "https:" || !["discord.com", "discordapp.com"].includes(u.hostname) || !u.pathname.startsWith("/api/webhooks/")) return;
    } catch {
      return;
    }

    const embed = {
      title: payload.title,
      description: payload.description,
      color: payload.color || (payload.event === "SUBMISSION" ? 0x8b5cf6 : payload.title.includes("Accepted") ? 0x10b981 : 0xf43f5e),
      fields: payload.fields || [],
      footer: {
        text: `RoleFlow Audit Log • ${guild.name}`,
        icon_url: "https://roleflow.site/logo-square.png",
      },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "RoleFlow Logs",
        avatar_url: "https://roleflow.site/logo-square.png",
        allowed_mentions: { parse: [] },
        embeds: [embed],
      }),
    });
  } catch (err) {
    console.warn("Failed to dispatch community webhook log:", err);
  }
}
