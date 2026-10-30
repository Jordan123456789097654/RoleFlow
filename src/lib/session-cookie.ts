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

/** Holds the staff member's own session while a diagnostic session is open, so End session can restore it. */
export const SUPPORT_RETURN_COOKIE = "rf_support_return";

export function setSupportReturnCookie(res: NextResponse, value: string) {
  res.cookies.set(SUPPORT_RETURN_COOKIE, value, {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    domain: cookieDomain(),
  });
}

export function clearSupportReturnCookie(res: NextResponse) {
  res.cookies.set(SUPPORT_RETURN_COOKIE, "", {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    domain: cookieDomain(),
  });
}

/** The ticket reference a diagnostic session was opened for. Shown in the session banner. */
export const SUPPORT_TICKET_COOKIE = "rf_support_ticket";

export function setSupportTicketCookie(res: NextResponse, ticketRef: string) {
  res.cookies.set(SUPPORT_TICKET_COOKIE, ticketRef, {
    path: "/",
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    domain: cookieDomain(),
  });
}

export function clearSupportTicketCookie(res: NextResponse) {
  res.cookies.set(SUPPORT_TICKET_COOKIE, "", { path: "/", httpOnly: true, secure: isProd(), sameSite: "lax", maxAge: 0, expires: new Date(0), domain: cookieDomain() });
}
