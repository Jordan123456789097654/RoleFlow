/** Slash commands RoleFlow exposes. Registered once per bot application. */
export const ROLEFLOW_COMMANDS = [
  { name: "status", description: "See the status of your RoleFlow applications" },
  { name: "openings", description: "List this community's open positions" },
  { name: "apply", description: "Get the link to apply to this community" },
];

/** Registers the commands for a bot application, authenticated with that bot's token. */
export async function registerCommands(applicationId: string, botToken: string): Promise<{ ok: true; count: number } | { ok: false; status: number; detail: string }> {
  const res = await fetch(`https://discord.com/api/v10/applications/${applicationId}/commands`, {
    method: "PUT",
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(ROLEFLOW_COMMANDS),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    return { ok: false, status: res.status, detail };
  }
  return { ok: true, count: ROLEFLOW_COMMANDS.length };
}
