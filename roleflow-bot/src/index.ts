import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import { parseBotConfig } from "./config";
import { enforceGuildGuard } from "./guard";

/**
 * Entry point for roleflow-bot daemon.
 */
export async function createBotClient() {
  const config = parseBotConfig();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.once(Events.ClientReady, async (c) => {
    console.log(`[BOT READY] Logged in as ${c.user.tag} (${c.user.id})`);

    // Audit connected guilds on startup: leave any server that is not the RoleFlow community server
    for (const guild of c.guilds.cache.values()) {
      await enforceGuildGuard(guild, config.roleflowServerId);
    }
  });

  // Guard all incoming guild create events (e.g. if an admin invites bot to another server)
  client.on(Events.GuildCreate, async (guild) => {
    await enforceGuildGuard(guild, config.roleflowServerId);
  });

  return { client, config };
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  createBotClient()
    .then(({ client, config }) => client.login(config.discordBotToken))
    .catch((err) => {
      console.error("[FATAL STARTUP ERROR]", err);
      process.exit(1);
    });
}
