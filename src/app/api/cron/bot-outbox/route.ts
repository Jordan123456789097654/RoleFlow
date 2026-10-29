import { NextResponse } from "next/server";
import { processOutbox } from "@/lib/bot-outbox";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Retries queued Discord actions. Called by a scheduler with the CRON_SECRET bearer token. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processOutbox(50);
  return NextResponse.json({ ok: true, ...result });
}
