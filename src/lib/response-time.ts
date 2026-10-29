import { prisma } from "./prisma";

const MIN_SAMPLE = 3;
const WINDOW_DAYS = 90;

/**
 * Typical time a community takes to reach a decision, based on its recently
 * decided applications. Returns null when there isn't enough data to be honest about.
 * Note: uses updatedAt as the decision time, so it is an estimate.
 */
export async function getGuildResponseTime(guildId: string): Promise<string | null> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await prisma.application.findMany({
    where: {
      position: { guildId },
      status: { in: ["ACCEPTED", "REJECTED"] },
      updatedAt: { gte: since },
    },
    select: { createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  if (rows.length < MIN_SAMPLE) return null;

  const hours = rows
    .map((r) => (r.updatedAt.getTime() - r.createdAt.getTime()) / 3_600_000)
    .sort((a, b) => a - b);
  const mid = Math.floor(hours.length / 2);
  const median = hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;

  if (median < 1) return "under an hour";
  if (median < 24) return `about ${Math.round(median)} hour${Math.round(median) === 1 ? "" : "s"}`;
  const days = Math.round(median / 24);
  return `about ${days} day${days === 1 ? "" : "s"}`;
}
