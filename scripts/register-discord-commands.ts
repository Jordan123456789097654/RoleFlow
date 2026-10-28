/**
 * Registers RoleFlow's slash commands with Discord. Run once after deploying,
 * and again whenever the command list changes: npm run discord:register
 */
const commands = [
  { name: "status", description: "See the status of your RoleFlow applications" },
  { name: "openings", description: "List this community's open positions" },
  { name: "apply", description: "Get the link to apply to this community" },
];

async function main() {
  const appId = process.env.DISCORD_CLIENT_ID;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!appId || !token) {
    console.error("DISCORD_CLIENT_ID and DISCORD_BOT_TOKEN must be set.");
    process.exit(1);
  }
  const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
    method: "PUT",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    console.error(`Registration failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`Registered ${commands.length} commands.`);
}

main();
