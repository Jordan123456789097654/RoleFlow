import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "roleflow_user_id";

function getSecret(): string | null {
  const secret = process.env.APP_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Cookie format: "<userId>.<sessionVersion>.<hmac>".
 * The sessionVersion must match the user's current value in the database,
 * so bumping it (password reset, ban) revokes every existing session.
 */
export function signSessionValue(userId: string, sessionVersion: number, expiresAtSec?: number): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("APP_SECRET must be set (at least 16 characters) to create sessions.");
  }
  // Support sessions carry an expiry inside the signed value, so a copied cookie stops working on time.
  const payload = expiresAtSec ? `${userId}.${sessionVersion}.${expiresAtSec}` : `${userId}.${sessionVersion}`;
  return `${payload}.${hmac(payload, secret)}`;
}

/** Checks the signature only. Does not confirm the session is still valid. */
export function parseSessionValue(raw: string | undefined | null): { userId: string; sessionVersion: number; expiresAtSec?: number } | null {
  const secret = getSecret();
  if (!raw || !secret) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);

  const expected = hmac(payload, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const parts = payload.split(".");
  if (parts.length !== 2 && parts.length !== 3) return null;
  const userId = parts[0];
  if (!userId) return null;
  const sessionVersion = Number(parts[1]);
  if (!Number.isInteger(sessionVersion)) return null;

  if (parts.length === 3) {
    const expiresAtSec = Number(parts[2]);
    if (!Number.isInteger(expiresAtSec) || Date.now() >= expiresAtSec * 1000) return null;
    return { userId, sessionVersion, expiresAtSec };
  }
  return { userId, sessionVersion };
}

/** Full check: signature valid AND session version still current. Returns the user ID or null. */
export async function verifySessionValue(raw: string | undefined | null): Promise<string | null> {
  const parsed = parseSessionValue(raw);
  if (!parsed) return null;

  const { prisma } = await import("./prisma");
  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { sessionVersion: true, isBanned: true, robloxId: true, robloxUsername: true },
  });
  if (!user || user.sessionVersion !== parsed.sessionVersion) return null;

  // Every request re-checks bans. The isBanned flag is only a fast path: a banned account is confirmed
  // against the real ban records, so a lapsed timed ban never locks someone out.
  if (user.isBanned) {
    const { findActiveBan } = await import("./bans");
    const ban = await findActiveBan({
      discordId: parsed.userId,
      robloxId: user.robloxId,
      robloxUsername: user.robloxUsername,
    });
    if (ban) return null;
  }
  return parsed.userId;
}
