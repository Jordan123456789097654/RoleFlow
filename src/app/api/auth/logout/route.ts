import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Determine correct base URL for redirection
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const baseUrl = host.includes("localhost") || host.includes("127.0.0.1")
    ? "http://localhost:3000"
    : `https://${host}`;

  const redirectUrl = new URL("/", baseUrl);
  const response = NextResponse.redirect(redirectUrl);

  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  // 1. Clear cookie with the exact domain used during login (.roleflow.site)
  response.cookies.set("roleflow_user_id", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    ...(isLocalhost ? {} : { domain: ".roleflow.site" }),
  });

  // 2. Also delete with default host domain to cover local and host-level sets
  response.cookies.delete("roleflow_user_id");

  return response;
}
