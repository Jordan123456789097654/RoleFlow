/**
 * Registers RoleFlow's slash commands for the official bot. Run after deploying, and again
 * whenever the command list changes: npm run discord:register
 */
import { registerCommands } from "../src/lib/discord-commands";

async function main() {
  const appId = process.env.DISCORD_CLIENT_ID;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!appId || !token) {
    console.error("DISCORD_CLIENT_ID and DISCORD_BOT_TOKEN must be set.");
    process.exit(1);
  }
  const result = await registerCommands(appId, token);
  if (!result.ok) {
    console.error(`Registration failed: ${result.status} ${result.detail}`);
    process.exit(1);
  }
  console.log(`Registered ${result.count} commands.`);
}

main();
