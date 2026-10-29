import { NextResponse } from "next/server";
import { redeemBridgeToken, setHostSessionCookie } from "@/lib/custom-domain-auth";
import { isPlatformHost } from "@/lib/custom-domain";

export const dynamic = "force-dynamic";

/** Runs on a community's custom domain after sign-in on roleflow.site. Sets that domain's own session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
  if (!host || isPlatformHost(host)) return new NextResponse("Not found", { status: 404 });

  const value = redeemBridgeToken(url.searchParams.get("token"), host);
  if (!value) {
    return new NextResponse("This sign-in link has expired. Please sign in again.", { status: 400 });
  }

  const next = url.searchParams.get("next") || "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const res = NextResponse.redirect(new URL(safeNext, `https://${host}`));
  setHostSessionCookie(res, value);
  return res;
}
