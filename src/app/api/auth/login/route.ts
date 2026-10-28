import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const clientId = process.env.DISCORD_CLIENT_ID || "1565049592788025344";
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${origin}/api/auth/callback`;

  // Official Discord OAuth2 Authorization Endpoint
  const scopes = ["identify", "email", "guilds"].join("%20");
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scopes}`;

  return NextResponse.redirect(discordAuthUrl);
}
