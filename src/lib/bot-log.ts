import { prisma } from "./prisma";
import type { BotLogLevel } from "./discord-gateway";

const MAX_LINE = 500;
const RETENTION_DAYS = 7;

/** Stores one console line for a community's bot. Never throws: logging must not stop the bot. */
export async function recordBotLog(guildId: string, level: BotLogLevel, message: string): Promise<void> {
  try {
    await prisma.botLog.create({
      data: { guildId, level, message: message.replace(/\s+$/, "").slice(0, MAX_LINE) },
    });
  } catch (err) {
    console.error("[Bot Log] Could not save log line:", (err as Error).message);
  }
}

/** Drops lines older than the retention window. Run periodically from the bot daemon. */
export async function pruneBotLogs(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60_000);
  await prisma.botLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
