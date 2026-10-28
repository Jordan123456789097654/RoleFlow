/**
 * Better Stack Logging & Telemetry Helper
 * Sends structured JSON logs to Better Stack (Logtail) via HTTPS Ingest
 */

const BETTERSTACK_TOKEN =
  process.env.BETTERSTACK_SOURCE_TOKEN ||
  process.env.LOGTAIL_SOURCE_TOKEN;

type LogLevel = "info" | "warn" | "error" | "debug";

export async function logToBetterStack(
  level: LogLevel,
  message: string,
  metadata: Record<string, any> = {}
) {
  // Always log to stdout for Vercel logs
  const timestamp = new Date().toISOString();
  console.log(`[${level.toUpperCase()}] [${timestamp}] ${message}`, metadata);

  // If Better Stack token is configured, stream to Better Stack Ingestion API
  if (!BETTERSTACK_TOKEN) return;

  try {
    fetch("https://in.logs.betterstack.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BETTERSTACK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dt: timestamp,
        level,
        message,
        service: "roleflow",
        environment: process.env.NODE_ENV || "production",
        ...metadata,
      }),
    }).catch(() => {});
  } catch (e) {
    // Silently ignore telemetry transport errors to avoid blocking user requests
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, any>) => logToBetterStack("info", msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => logToBetterStack("warn", msg, meta),
  error: (msg: string, meta?: Record<string, any>) => logToBetterStack("error", msg, meta),
};
