import { prisma } from "../src/lib/prisma";
import { decryptSecret } from "../src/lib/crypto";
import { DiscordGatewayConnection } from "../src/lib/discord-gateway";
import { processOutbox } from "../src/lib/bot-outbox";

/** Keeps each community's bot connected, and writes its live status to the database for the dashboard. */
const SYNC_MS = 60_000;
const HEARTBEAT_MS = 60_000;
const OUTBOX_MS = 30_000;

type Status = "ONLINE" | "OFFLINE" | "ERROR";
type Running = { conn: DiscordGatewayConnection; token: string; name: string; status: Status };
const running = new Map<string, Running>(); // community ID -> live connection

async function writeStatus(guildId: string, status: Status, message: string) {
  await prisma.guild
    .update({
      where: { id: guildId },
      data: { botLiveStatus: status, botLiveStatusAt: new Date(), botLiveMessage: message.slice(0, 200) },
    })
    .catch((e) => console.error("[Bot Daemon] Could not save status:", (e as Error).message));
}

function connect(g: { id: string; name: string }, token: string) {
  const conn = new DiscordGatewayConnection({
    guildId: g.id,
    name: g.name,
    token,
    status: "online",
    activityType: 3, // Watching
    activityName: `${g.name} Applications`,
    onStatus: (status, message) => {
      const entry = running.get(g.id);
      if (entry) entry.status = status;
      writeStatus(g.id, status, message);
    },
  });
  running.set(g.id, { conn, token, name: g.name, status: "OFFLINE" });
  conn.start();
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

  // Stop bots that were disabled, removed, or re-keyed, and mark them offline.
  for (const [id, r] of running) {
    const w = wanted.get(id);
    if (!w || w.token !== r.token) {
      r.conn.stop();
      running.delete(id);
      await writeStatus(id, "OFFLINE", "Bot was turned off");
      console.log(`[Bot Daemon] Stopped bot for ${r.name}`);
    }
  }
  // Start newly enabled bots.
  for (const [id, w] of wanted) {
    if (!running.has(id)) connect(w, w.token);
  }
}

/** Refreshes the timestamp for connected bots, so the dashboard knows the daemon is still alive. */
async function heartbeat() {
  for (const [id, r] of running) {
    if (r.status === "ONLINE") await writeStatus(id, "ONLINE", "Connected");
  }
}

async function main() {
  console.log("[Bot Daemon] Starting community bots...");
  await syncBots();
  setInterval(() => syncBots().catch((e) => console.error("[Bot Daemon] Sync failed:", e)), SYNC_MS);
  setInterval(() => heartbeat().catch((e) => console.error("[Bot Daemon] Heartbeat failed:", e)), HEARTBEAT_MS);
  setInterval(() => processOutbox().catch((e) => console.error("[Bot Daemon] Outbox failed:", e)), OUTBOX_MS);
}

async function shutdown() {
  console.log("Bot Daemon stopping...");
  for (const [id, r] of running) {
    r.conn.stop();
    await writeStatus(id, "OFFLINE", "Bot daemon stopped");
  }
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
