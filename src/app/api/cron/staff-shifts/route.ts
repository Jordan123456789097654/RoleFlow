import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { closeStaleShifts } from "@/lib/shift-ingest";
import { HEARTBEAT_TIMEOUT_MS } from "@/lib/staff-roster";

export const dynamic = "force-dynamic";

/**
 * Closes shifts whose heartbeat went silent, even when no event arrives.
 * Schedule every 5 minutes with: Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - HEARTBEAT_TIMEOUT_MS);
  const guilds = await prisma.shift.findMany({
    where: { status: "ACTIVE", lastHeartbeatAt: { lt: cutoff } },
    select: { guildId: true },
    distinct: ["guildId"],
  });

  let closed = 0;
  for (const g of guilds) closed += await closeStaleShifts(g.guildId, now);
  return NextResponse.json({ ok: true, closed });
}
