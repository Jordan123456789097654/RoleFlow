import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isPlatformHost, validCustomReturn } from "@/lib/custom-domain";
import { platformOrigin } from "@/lib/platform-origin";

export const dynamic = "force-dynamic";

const OAUTH_STATE_COOKIE = "rf_oauth_state";
const OAUTH_RETURN_COOKIE = "rf_oauth_return";
const PLATFORM = platformOrigin();

export async function GET(request: Request) {
  const noEmail = new URL(request.url).searchParams.get("noemail") === "1";
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0].trim().toLowerCase();

  // On a community's custom domain, sign-in has to happen on roleflow.site (Discord's redirect is fixed there).
  // Send the user there and ask it to bring them back to this exact page afterwards.
  if (!isPlatformHost(host)) {
    let next = "/";
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const r = new URL(referer);
        if (r.host.toLowerCase() === host && r.pathname.startsWith("/") && !r.pathname.startsWith("/api/")) {
          next = r.pathname + r.search;
        }
      } catch {
        /* keep "/" */
      }
    }
    const back = `https://${host}${next}`;
    return NextResponse.redirect(`${PLATFORM}/api/auth/login?return=${encodeURIComponent(back)}${noEmail ? "&noemail=1" : ""}`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID || "1565049592788025344";
  if (!clientId) {
    return NextResponse.json({ error: "Discord login is not configured." }, { status: 500 });
  }

  const state = randomBytes(24).toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: "https://roleflow.site/api/auth/callback",
    response_type: "code",
    scope: noEmail ? "identify guilds" : "identify email guilds",
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

  // Remember where to return after sign-in, but only if it is a verified custom domain.
  const back = await validCustomReturn(new URL(request.url).searchParams.get("return"));
  if (back) {
    // Store the raw URL. Next's cookie serializer percent-encodes the value itself, so encoding it here as well
    // made the callback read a double-encoded string that failed validation and dropped the user on roleflow.site.
    res.cookies.set(OAUTH_RETURN_COOKIE, back, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    });
  }
  return res;
}
