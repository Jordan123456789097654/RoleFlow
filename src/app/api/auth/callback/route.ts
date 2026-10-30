import { findActiveBan } from "@/lib/bans";
import { notifyNewDevice } from "@/lib/second-factor";
import { validCustomReturn } from "@/lib/custom-domain";
import { signBridgeToken } from "@/lib/custom-domain-auth";
import { signSessionValue } from "@/lib/session";
import { setSessionCookie, oauthRedirectUri } from "@/lib/session-cookie";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  // CSRF check: the state Discord echoes back must match the cookie we set when the login began.
  const state = searchParams.get("state") || "";
  const expected = request.headers.get("cookie")?.match(/(?:^|;\s*)rf_oauth_state=([^;]+)/)?.[1] || "";
  const a = Buffer.from(state);
  const b = Buffer.from(expected);
  if (!state || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?error=oauth_error", request.url));
  }
  const redirectUri = "https://roleflow.site/api/auth/callback";

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Discord token exchange failed:", tokenResponse.status);
      return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile from Discord API
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/?error=fetch_user_failed", request.url));
    }

    const discordUser = await userRes.json();
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.discriminator || "0") % 5}.png`;

    // Check if user is a designated site admin
    const adminIds = (process.env.SITE_ADMIN_DISCORD_IDS || "").split(",").map((s) => s.trim());
    const isSiteAdmin = adminIds.includes(discordUser.id);

    // Global blacklist and active bans or suspensions block sign-in.
    const ban = await findActiveBan({ discordId: discordUser.id });
    if (ban) {
      return NextResponse.redirect(new URL("/?error=account_suspended", request.url));
    }

    // 3. Upsert User in database
    const existingEmail = await prisma.user.findUnique({ where: { id: discordUser.id }, select: { emailRemovedAt: true } });
    const user = await prisma.user.upsert({
      where: { id: discordUser.id },
      update: {
        username: discordUser.global_name || discordUser.username,
        discriminator: discordUser.discriminator !== "0" ? discordUser.discriminator : null,
        avatar: avatarUrl,
        // Respect a user's removal of their email: do not re-sync it from Discord.
        // Only update the email when Discord sent one, so a no-email sign-in never clears a saved address.
        ...(discordUser.email && !existingEmail?.emailRemovedAt ? { email: discordUser.email } : {}),
        ...(isSiteAdmin ? { isSiteAdmin: true } : {}),
      },
      create: {
        id: discordUser.id,
        username: discordUser.global_name || discordUser.username,
        discriminator: discordUser.discriminator !== "0" ? discordUser.discriminator : null,
        avatar: avatarUrl,
        email: discordUser.email || null,
        isSiteAdmin,
      },
    });

    await notifyNewDevice(user, request);

    // 4. Set session cookie on roleflow.site. If sign-in started on a community's custom domain, hand off to it.
    const returnRaw = request.headers.get("cookie")?.match(/(?:^|;\s*)rf_oauth_return=([^;]+)/)?.[1];
    const returnTo = await validCustomReturn(returnRaw ? decodeURIComponent(returnRaw) : null);

    const response = returnTo
      ? NextResponse.redirect(bridgeUrl(returnTo, signBridgeToken(user.id, user.sessionVersion, new URL(returnTo).host)))
      : NextResponse.redirect(new URL("/", request.url));
    setSessionCookie(response, signSessionValue(user.id, user.sessionVersion));
    response.cookies.set("rf_oauth_state", "", { path: "/", maxAge: 0 });
    response.cookies.set("rf_oauth_return", "", { path: "/", maxAge: 0 });

    return response;
  } catch (err) {
    console.error("OAuth error:", err);
    return NextResponse.redirect(new URL("/?error=oauth_error", request.url));
  }
}

function bridgeUrl(returnTo: string, token: string): URL {
  const target = new URL(returnTo);
  const url = new URL("/api/auth/bridge", target.origin);
  url.searchParams.set("token", token);
  url.searchParams.set("next", target.pathname + target.search);
  return url;
}
