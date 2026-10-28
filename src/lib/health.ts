import { prisma } from "./prisma";

/** Records an operational event for the health dashboard. Never throws. */
export async function logEvent(level: "INFO" | "WARN" | "ERROR", source: string, message: string): Promise<void> {
  try {
    await prisma.systemEvent.create({ data: { level, source, message: message.slice(0, 1000) } });
  } catch (err) {
    console.error("logEvent failed:", err);
  }
}
