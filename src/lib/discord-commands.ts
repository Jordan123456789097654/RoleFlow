/** Slash commands RoleFlow exposes. Registered once per bot application. */
export const ROLEFLOW_COMMANDS = [
  // Everyone
  { name: "help", description: "List RoleFlow commands" },
  { name: "status", description: "See the status of your RoleFlow applications" },
  { name: "openings", description: "List this community's open positions" },
  { name: "apply", description: "Get the link to apply to this community" },
  // Staff
  { name: "pending", description: "Show the oldest applications waiting for review (staff)" },
  { name: "stats", description: "Application counts for this community (staff)" },
  {
    name: "lookup",
    description: "Look up a member's applications and account signals (staff)",
    options: [{ name: "user", description: "The member to look up", type: 6, required: true }],
  },
  {
    name: "accept",
    description: "Accept an application by its ID (staff with decision access)",
    options: [
      { name: "application_id", description: "The application ID from /pending", type: 3, required: true },
      { name: "note", description: "Optional note sent to the applicant", type: 3, required: false },
    ],
  },
  {
    name: "reject",
    description: "Reject an application by its ID (staff with decision access)",
    options: [
      { name: "application_id", description: "The application ID from /pending", type: 3, required: true },
      { name: "note", description: "Optional note sent to the applicant", type: 3, required: false },
    ],
  },
];

/** 
 * Registers the commands for a bot application, authenticated with that bot's token. 
 * If guildId is provided, registers as GUILD commands (instant, 0-second cache delay).
 */
export async function registerCommands(
  applicationId: string, 
  botToken: string,
  guildId?: string
): Promise<{ ok: true; count: number } | { ok: false; status: number; detail: string }> {
  // 1. If guildId is provided, register to the guild first so commands show up immediately without waiting 1 hour!
  const url = guildId 
    ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${applicationId}/commands`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(ROLEFLOW_COMMANDS),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    return { ok: false, status: res.status, detail };
  }

  // 2. Also register globally in background so it works in DMs and across other servers
  if (guildId) {
    fetch(`https://discord.com/api/v10/applications/${applicationId}/commands`, {
      method: "PUT",
      headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(ROLEFLOW_COMMANDS),
    }).catch(() => {});
  }

  return { ok: true, count: ROLEFLOW_COMMANDS.length };
}
