import { prisma } from "../src/lib/prisma";
import { decryptSecret } from "../src/lib/crypto";
import { DiscordGatewayConnection } from "../src/lib/discord-gateway";

/** Each community runs its own bot. This daemon keeps those gateway connections online. */
const POLL_MS = 60_000;
const started = new Set<string>(); // community IDs whose bot is already connected

async function syncBots() {
  const guilds = await prisma.guild.findMany({
    where: { useCustomBot: true, customBotToken: { not: null } },
    select: { id: true, name: true, customBotToken: true },
  });

  for (const g of guilds) {
    if (started.has(g.id)) continue;
    try {
      const token = decryptSecret(g.customBotToken)?.trim();
      if (!token) continue;
      new DiscordGatewayConnection({
        guildId: g.id,
        name: g.name,
        token,
        status: "online",
        activityType: 3, // Watching
        activityName: `${g.name} Applications`,
      }).start();
      started.add(g.id);
      console.log(`[Bot Daemon] Connected bot for ${g.name}`);
    } catch (e) {
      console.error(`[Bot Daemon] Could not connect bot for ${g.name}:`, e);
    }
  }
}

async function main() {
  console.log("[Bot Daemon] Starting community bots...");
  await syncBots();
  setInterval(() => {
    syncBots().catch((e) => console.error("[Bot Daemon] Sync failed:", e));
  }, POLL_MS);

  process.on("SIGINT", () => {
    console.log("Bot Daemon stopping...");
    process.exit(0);
  });
}

main().catch(console.error);
