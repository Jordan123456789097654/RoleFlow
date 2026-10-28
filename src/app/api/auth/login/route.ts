import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { oauthRedirectUri } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

const OAUTH_STATE_COOKIE = "rf_oauth_state";

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Discord login is not configured." }, { status: 500 });
  }

  // Random state, bound to this browser by a short-lived cookie, checked in the callback (blocks login CSRF).
  const state = randomBytes(24).toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: oauthRedirectUri(),
    response_type: "code",
    scope: "identify email guilds",
    state,
  });

  const res = NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });
  return res;
}
