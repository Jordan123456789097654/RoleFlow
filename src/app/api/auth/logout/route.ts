import { NextResponse } from "next/server";
import { appOrigin, clearSessionCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

// POST so a third-party page cannot log users out with an <img> tag. GET kept for existing links.
function logout() {
  const response = NextResponse.redirect(new URL("/", appOrigin()), { status: 303 });
  clearSessionCookie(response);
  return response;
}

export const GET = logout;
export const POST = logout;
