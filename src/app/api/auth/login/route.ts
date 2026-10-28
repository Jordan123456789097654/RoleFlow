import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const clientId = process.env.DISCORD_CLIENT_ID || "1565049592788025344";

  // Production always uses apex domain https://roleflow.site to match Discord's registered redirect URI.
  // We ignore accidental localhost DISCORD_REDIRECT_URI environment variables when on live domain.
  let redirectUri = "https://roleflow.site/api/auth/callback";
  if (isLocal) {
    redirectUri = "http://localhost:3000/api/auth/callback";
  } else if (process.env.DISCORD_REDIRECT_URI && !process.env.DISCORD_REDIRECT_URI.includes("localhost")) {
    redirectUri = process.env.DISCORD_REDIRECT_URI;
  }

  // Official Discord OAuth2 Authorization Endpoint
  const scopes = ["identify", "email", "guilds"].join("%20");
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scopes}`;

  return NextResponse.redirect(discordAuthUrl);
}
