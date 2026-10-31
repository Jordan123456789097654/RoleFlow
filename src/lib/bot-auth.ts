import { NextResponse } from "next/server";

export function checkBotAuth(request: Request): NextResponse | null {
  if (process.env.SITE_LOCKDOWN === "true") {
    return NextResponse.json({ error: "Site is currently in lockdown mode" }, { status: 503 });
  }

  const expectedSecret = process.env.BOT_API_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json({ error: "BOT_API_SECRET is not configured on the server" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
