/**
 * Strongly typed configuration parser for roleflow-bot.
 * Fails fast with descriptive errors if any mandatory variable is missing or malformed.
 */

export interface BotConfig {
  discordBotToken: string;
  discordAppId: string;
  roleflowServerId: string;
  verifyChannelId: string;
  staffChannelId: string;
  verifiedRoleId: string;
  roleflowApiBase: string;
  botApiSecret: string;
}

const REQUIRED_KEYS = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_APP_ID",
  "ROLEFLOW_SERVER_ID",
  "VERIFY_CHANNEL_ID",
  "STAFF_CHANNEL_ID",
  "VERIFIED_ROLE_ID",
  "ROLEFLOW_API_BASE",
  "BOT_API_SECRET",
] as const;

export function parseBotConfig(env: Record<string, string | undefined> = process.env): BotConfig {
  const missing: string[] = [];

  for (const key of REQUIRED_KEYS) {
    const val = env[key];
    if (!val || !val.trim()) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for roleflow-bot: ${missing.join(", ")}`);
  }

  // Validate API base URL format
  const apiBase = env.ROLEFLOW_API_BASE!.trim().replace(/\/+$/, "");
  try {
    new URL(apiBase);
  } catch {
    throw new Error(`Invalid URL format for ROLEFLOW_API_BASE: "${apiBase}"`);
  }

  // Validate BOT_API_SECRET minimum security length (at least 16 chars)
  if (env.BOT_API_SECRET!.trim().length < 16) {
    throw new Error("BOT_API_SECRET must be at least 16 characters long.");
  }

  return {
    discordBotToken: env.DISCORD_BOT_TOKEN!.trim(),
    discordAppId: env.DISCORD_APP_ID!.trim(),
    roleflowServerId: env.ROLEFLOW_SERVER_ID!.trim(),
    verifyChannelId: env.VERIFY_CHANNEL_ID!.trim(),
    staffChannelId: env.STAFF_CHANNEL_ID!.trim(),
    verifiedRoleId: env.VERIFIED_ROLE_ID!.trim(),
    roleflowApiBase: apiBase,
    botApiSecret: env.BOT_API_SECRET!.trim(),
  };
}
