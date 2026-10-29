/** Slash commands RoleFlow exposes. Registered once per bot application. */
export const ROLEFLOW_COMMANDS = [
  // Public commands
  { name: "help", description: "List all RoleFlow commands and portal links" },
  { name: "status", description: "See the status of your RoleFlow applications" },
  { name: "openings", description: "List this community's open staff and creator positions" },
  { name: "apply", description: "Get the direct link to apply to this community" },
  { name: "ping", description: "Check RoleFlow bot latency and API connectivity" },
  
  // Staff review & queue commands
  { name: "pending", description: "Show the oldest applications waiting for review (staff)" },
  { name: "stats", description: "Show recruitment metrics & approval rates for this community (staff)" },
  {
    name: "lookup",
    description: "Look up a member's applications, notes, and account signals (staff)",
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
  {
    name: "interview",
    description: "Advance an application directly to the Interview stage (staff)",
    options: [
      { name: "application_id", description: "The application ID from /pending", type: 3, required: true },
    ],
  },
  {
    name: "hold",
    description: "Put an application on hold while reviewing others (staff)",
    options: [
      { name: "application_id", description: "The application ID from /pending", type: 3, required: true },
      { name: "note", description: "Reason for hold", type: 3, required: false },
    ],
  },
  {
    name: "portal",
    description: "Get direct links to community application portal and staff dashboard",
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

  // Also register globally in background so it works in DMs and across other servers
  if (guildId) {
    fetch(`https://discord.com/api/v10/applications/${applicationId}/commands`, {
      method: "PUT",
      headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(ROLEFLOW_COMMANDS),
    }).catch(() => {});
  }

  return { ok: true, count: ROLEFLOW_COMMANDS.length };
}
