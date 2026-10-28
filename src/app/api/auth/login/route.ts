import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "";
  const clientId = process.env.DISCORD_CLIENT_ID || "1565049592788025344";

  // Determine redirect URI
  let redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!redirectUri) {
    if (host.includes("localhost")) {
      redirectUri = "http://localhost:3000/api/auth/callback";
    } else {
      // Always use apex domain https://roleflow.site to guarantee matching Discord's registered redirect URI
      redirectUri = "https://roleflow.site/api/auth/callback";
    }
  }

  // Official Discord OAuth2 Authorization Endpoint
  const scopes = ["identify", "email", "guilds"].join("%20");
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scopes}`;

  return NextResponse.redirect(discordAuthUrl);
}
