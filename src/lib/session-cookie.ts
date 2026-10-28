import type { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./session";

const isProd = () => process.env.NODE_ENV === "production";

function cookieDomain(): string | undefined {
  if (!isProd()) return undefined;
  return process.env.COOKIE_DOMAIN || ".roleflow.site";
}

/** One place that sets the session cookie, so every login path uses identical, secure flags. */
export function setSessionCookie(res: NextResponse, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  res.cookies.set(SESSION_COOKIE_NAME, value, {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    maxAge: maxAgeSeconds,
    domain: cookieDomain(),
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    domain: cookieDomain(),
  });
  // Also clear any host-only cookie set by older versions.
  res.cookies.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0, expires: new Date(0) });
}

export function appOrigin(): string {
  return "https://roleflow.site";
}

export function oauthRedirectUri(): string {
  return "https://roleflow.site/api/auth/callback";
}
