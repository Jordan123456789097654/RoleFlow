import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, signSessionValue } from "./session";

const TTL_SECONDS = 120;

function sign(payload: string): string {
  const secret = process.env.APP_SECRET || "";
  return createHmac("sha256", secret).update(`bridge:${payload}`).digest("base64url");
}

/** A short-lived token that lets a verified custom domain start a session. Bound to one host and expires quickly. */
export function signBridgeToken(userId: string, sessionVersion: number, host: string): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${userId}|${sessionVersion}|${host.toLowerCase()}|${exp}`;
  return `${payload}|${sign(payload)}`;
}

/** Returns the session value to store on the custom domain, or null if the token is invalid, expired, or for another host. */
export function redeemBridgeToken(token: string | null, host: string): string | null {
  if (!token) return null;
  const cut = token.lastIndexOf("|");
  if (cut <= 0) return null;
  const payload = token.slice(0, cut);
  const sig = token.slice(cut + 1);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [userId, version, tokenHost, exp] = payload.split("|");
  if (!userId || tokenHost !== host.toLowerCase()) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const sessionVersion = Number(version);
  if (!Number.isInteger(sessionVersion)) return null;
  return signSessionValue(userId, sessionVersion);
}

/** Session cookie for a custom domain: no Domain attribute, so the browser keeps it on that host only. */
export function setHostSessionCookie(res: NextResponse, value: string) {
  res.cookies.set(SESSION_COOKIE_NAME, value, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}
