import { prisma } from "../src/lib/prisma";
import { decryptSecret } from "../src/lib/crypto";
import { DiscordGatewayConnection } from "../src/lib/discord-gateway";

/** Each community runs its own bot. This daemon keeps those gateway connections online. */
const POLL_MS = 60_000;

type Running = { conn: DiscordGatewayConnection; token: string; name: string };
const running = new Map<string, Running>(); // community ID -> live connection

function connect(g: { id: string; name: string }, token: string) {
  const conn = new DiscordGatewayConnection({
    guildId: g.id,
    name: g.name,
    token,
    status: "online",
    activityType: 3, // Watching
    activityName: `${g.name} Applications`,
  });
  conn.start();
  running.set(g.id, { conn, token, name: g.name });
  console.log(`[Bot Daemon] Connecting bot for ${g.name}`);
}

async function syncBots() {
  const guilds = await prisma.guild.findMany({
    where: { useCustomBot: true, customBotToken: { not: null } },
    select: { id: true, name: true, customBotToken: true },
  });
  const wanted = new Map<string, { id: string; name: string; token: string }>();

  for (const g of guilds) {
    try {
      const token = decryptSecret(g.customBotToken)?.trim();
      if (token) wanted.set(g.id, { id: g.id, name: g.name, token });
    } catch (e) {
      console.error(`[Bot Daemon] Could not decrypt token for ${g.name}:`, (e as Error).message);
    }
  }

  // Stop bots that were disabled, removed, or whose token was replaced.
  for (const [id, r] of running) {
    const w = wanted.get(id);
    if (!w || w.token !== r.token) {
      r.conn.stop();
      running.delete(id);
      console.log(`[Bot Daemon] Stopped bot for ${r.name}`);
    }
  }
  // Start newly enabled bots.
  for (const [id, w] of wanted) {
    if (!running.has(id)) connect(w, w.token);
  }
}

async function main() {
  console.log("[Bot Daemon] Starting community bots...");
  await syncBots();
  setInterval(() => {
    syncBots().catch((e) => console.error("[Bot Daemon] Sync failed:", e));
  }, POLL_MS);
}

function shutdown() {
  console.log("Bot Daemon stopping...");
  for (const r of running.values()) r.conn.stop();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
