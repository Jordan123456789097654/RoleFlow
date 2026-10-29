import { prisma } from "../src/lib/prisma";
import { decryptSecret } from "../src/lib/crypto";
import { DiscordGatewayConnection } from "../src/lib/discord-gateway";

async function main() {
  console.log("⚡ [RoleFlow Bot Daemon] Initializing Gateway Connections...");

  // 1. Official Platform Bot (if configured)
  if (process.env.DISCORD_BOT_TOKEN) {
    const mainBot = new DiscordGatewayConnection({
      guildId: "roleflow-official",
      name: "RoleFlow Official",
      token: process.env.DISCORD_BOT_TOKEN.trim(),
      status: "online",
      activityType: 3, // Watching
      activityName: "Applications on RoleFlow",
    });
    mainBot.start();
  }

  // 2. Load all community custom bots
  const customGuilds = await prisma.guild.findMany({
    where: {
      useCustomBot: true,
      customBotToken: { not: null },
    },
    select: {
      id: true,
      name: true,
      customBotToken: true,
    },
  });

  console.log(`⚡ [RoleFlow Bot Daemon] Found ${customGuilds.length} community custom bots.`);

  for (const g of customGuilds) {
    try {
      const rawToken = decryptSecret(g.customBotToken);
      if (!rawToken) continue;

      const bot = new DiscordGatewayConnection({
        guildId: g.id,
        name: g.name,
        token: rawToken,
        status: "online",
        activityType: 3, // Watching
        activityName: `${g.name} Applications`,
      });
      bot.start();
    } catch (e) {
      console.error(`Could not connect bot for community ${g.name}:`, e);
    }
  }

  // Keep process running
  process.on("SIGINT", () => {
    console.log("Bot Daemon stopping...");
    process.exit(0);
  });
}

main().catch(console.error);
