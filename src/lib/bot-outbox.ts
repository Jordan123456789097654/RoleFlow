import { prisma } from "./prisma";
import { decryptSecret } from "./crypto";
import { discordFetch, type DiscordResult } from "./discord-api";
import { sendApplicationStatusEmail } from "./email";

const MAX_ATTEMPTS = 8;
const LEASE_MS = 5 * 60_000;

export type EmailFallback = {
  toEmail: string;
  applicantName: string;
  communityName: string;
  positionTitle: string;
  status: "ACCEPTED" | "REJECTED" | "INTERVIEW" | "UNDER_REVIEW";
  decisionNote?: string | null;
  applicationId: string;
};

/** Emails the applicant when Discord can't deliver the update. */
export async function sendEmailFallback(fallback: EmailFallback | null | undefined): Promise<void> {
  if (!fallback?.toEmail) return;
  await sendApplicationStatusEmail(fallback).catch((e) =>
    console.error("[BotOutbox] Email fallback failed:", (e as Error).message)
  );
}

/**
 * Sends now. If Discord is rate limiting or down, saves the action to the outbox for a retry.
 * If Discord refuses for good (for example, DMs are closed), sends the email fallback straight away.
 */
export async function enqueueOrSend(opts: {
  guildId: string;
  token: string;
  kind: "ALERT" | "DM";
  key: string;
  method: "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  fallback?: EmailFallback;
}): Promise<DiscordResult> {
  const result = await discordFetch(opts.token, opts.method, opts.path, opts.body);
  if (result.ok) return result;

  if (!result.retryable) {
    if (opts.kind === "DM") await sendEmailFallback(opts.fallback);
    return result;
  }

  await prisma.botOutbox
    .create({
      data: {
        guildId: opts.guildId,
        kind: opts.kind,
        method: opts.method,
        path: opts.path,
        payload: (opts.body ?? undefined) as any,
        fallback: (opts.fallback ?? undefined) as any,
        idempotencyKey: opts.key,
        attempts: 1,
        lastError: result.error ?? `HTTP ${result.status}`,
        nextAttemptAt: new Date(Date.now() + 60_000),
      },
    })
    .catch((e: any) => {
      if (e?.code !== "P2002") throw e; // already queued under this key
    });
  return result;
}

/** Worker: retries queued Discord actions with backoff. Safe to run from more than one place at once. */
export async function processOutbox(limit = 25): Promise<{ sent: number; retried: number; failed: number }> {
  const due = await prisma.botOutbox.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });
  let sent = 0;
  let retried = 0;
  let failed = 0;

  for (const job of due) {
    // Claim the job so another worker doesn't send it at the same time.
    const claim = await prisma.botOutbox.updateMany({
      where: { id: job.id, status: "PENDING", nextAttemptAt: job.nextAttemptAt },
      data: { nextAttemptAt: new Date(Date.now() + LEASE_MS) },
    });
    if (claim.count === 0) continue;

    const guild = await prisma.guild.findUnique({
      where: { id: job.guildId },
      select: { useCustomBot: true, customBotToken: true },
    });
    const token = guild?.useCustomBot && guild.customBotToken ? decryptSecret(guild.customBotToken) : null;
    if (!token) {
      await prisma.botOutbox.update({
        where: { id: job.id },
        data: { status: "FAILED", lastError: "The bot is no longer connected." },
      });
      await sendEmailFallback(job.fallback as any);
      failed++;
      continue;
    }

    const res = await discordFetch(token, job.method as "POST" | "PUT" | "DELETE", job.path, job.payload ?? undefined, {
      retries: 1,
    });
    const attempts = job.attempts + 1;

    if (res.ok) {
      await prisma.botOutbox.update({
        where: { id: job.id },
        data: { status: "SENT", attempts, sentAt: new Date(), lastError: null },
      });
      sent++;
    } else if (!res.retryable || attempts >= MAX_ATTEMPTS) {
      await prisma.botOutbox.update({
        where: { id: job.id },
        data: { status: "FAILED", attempts, lastError: res.error ?? `HTTP ${res.status}` },
      });
      if (job.kind === "DM") await sendEmailFallback(job.fallback as any);
      failed++;
    } else {
      const delayMin = Math.min(60, 2 ** attempts) * (0.9 + Math.random() * 0.2);
      await prisma.botOutbox.update({
        where: { id: job.id },
        data: {
          attempts,
          lastError: res.error ?? `HTTP ${res.status}`,
          nextAttemptAt: new Date(Date.now() + delayMin * 60_000),
        },
      });
      retried++;
    }
  }
  return { sent, retried, failed };
}
