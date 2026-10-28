import { requiresSecondFactor, setPendingCookie, notifyNewDevice } from "@/lib/second-factor";
import { signSessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const clientId = process.env.DISCORD_CLIENT_ID || "1565049592788025344";
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  // Production always uses apex domain https://roleflow.site
  let redirectUri = "https://roleflow.site/api/auth/callback";
  if (isLocal) {
    redirectUri = "http://localhost:3000/api/auth/callback";
  } else if (process.env.DISCORD_REDIRECT_URI && !process.env.DISCORD_REDIRECT_URI.includes("localhost")) {
    redirectUri = process.env.DISCORD_REDIRECT_URI;
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Discord token exchange failed:", await tokenResponse.text());
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

    // Check if user is globally banned or blacklisted
    const globalBan = await prisma.globalBlacklist.findFirst({
      where: { targetType: "DISCORD_ID", targetValue: discordUser.id },
    });

    if (globalBan) {
      return NextResponse.redirect(new URL("/?error=account_suspended", request.url));
    }

    const activePunishment = await prisma.punishment.findFirst({
      where: {
        targetType: "USER",
        targetId: discordUser.id,
        liftedAt: null,
        action: { in: ["BAN", "SUSPENSION"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (activePunishment) {
      return NextResponse.redirect(new URL("/?error=account_suspended", request.url));
    }

    // 3. Upsert User in database
    const user = await prisma.user.upsert({
      where: { id: discordUser.id },
      update: {
        username: discordUser.global_name || discordUser.username,
        discriminator: discordUser.discriminator !== "0" ? discordUser.discriminator : null,
        avatar: avatarUrl,
        email: discordUser.email || null,
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

    if (requiresSecondFactor(user)) {
      const pending = NextResponse.redirect(new URL("/auth/2fa", request.url));
      setPendingCookie(pending, user.id, user.sessionVersion, host);
      return pending;
    }
    await notifyNewDevice(user, request);

    // 4. Set session cookie and redirect home
    const isLocalhost = host.includes("localhost");
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("roleflow_user_id", signSessionValue(user.id, user.sessionVersion), {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      ...(isLocalhost ? {} : { domain: ".roleflow.site" }),
    });

    return response;
  } catch (err) {
    console.error("OAuth error:", err);
    return NextResponse.redirect(new URL("/?error=oauth_error", request.url));
  }
}
