import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, signSessionValue } from "./session";
import { signToken, verifyToken } from "./signed-token";

const TTL_SECONDS = 120;

type BridgeData = { u: string; v: number; h: string };

/** A short-lived token that lets a verified custom domain start a session. Bound to one host and expires quickly. */
export function signBridgeToken(userId: string, sessionVersion: number, host: string): string {
  return signToken("bridge", { u: userId, v: sessionVersion, h: host.toLowerCase() }, TTL_SECONDS);
}

/** Returns the session value to store on the custom domain, or null if the token is invalid, expired, or for another host. */
export function redeemBridgeToken(token: string | null, host: string): string | null {
  const data = verifyToken<BridgeData>("bridge", token);
  if (!data || typeof data.u !== "string" || !data.u) return null;
  if (data.h !== host.toLowerCase()) return null;
  if (!Number.isInteger(data.v)) return null;
  return signSessionValue(data.u, data.v);
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
