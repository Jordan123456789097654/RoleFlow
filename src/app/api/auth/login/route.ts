import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

  if (!clientId || clientId === "123456789012345678") {
    // If running in local demo without a client ID, log in as demo user Jordan
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("roleflow_user_id", "dev_admin_user", {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }

  // Redirect to real Discord OAuth2 authorization URL (identify, email, guilds)
  const scopes = ["identify", "email", "guilds"].join("%20");
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scopes}`;

  return NextResponse.redirect(discordAuthUrl);
}
