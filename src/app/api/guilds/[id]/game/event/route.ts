import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGameSecret } from "@/lib/game-secret";
import { ingestGameEvent, SHIFT_TYPES } from "@/lib/shift-ingest";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4096;
const MAX_CLOCK_SKEW_SECONDS = 120;

/**
 * Receives join, heartbeat, and leave events from a Roblox server.
 * Auth: Authorization: Bearer <community game secret>, sent over HTTPS.
 * Only Roblox accounts linked to a staff member of this community are recorded.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!(await verifyGameSecret(params.id, token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body?.type;
  if (!["join", "heartbeat", "leave"].includes(type)) return NextResponse.json({ error: "Bad type" }, { status: 400 });

  const robloxUserId = String(body?.robloxUserId ?? "");
  if (!/^\d{1,20}$/.test(robloxUserId)) return NextResponse.json({ error: "Bad robloxUserId" }, { status: 400 });

  const serverJobId = String(body?.serverJobId ?? "");
  if (serverJobId.length < 1 || serverJobId.length > 100) return NextResponse.json({ error: "Bad serverJobId" }, { status: 400 });

  const placeRaw = body?.placeId == null ? null : String(body.placeId);
  if (placeRaw !== null && !/^\d{1,20}$/.test(placeRaw)) return NextResponse.json({ error: "Bad placeId" }, { status: 400 });

  const shiftType = SHIFT_TYPES.includes(body?.shiftType) ? body.shiftType : "STANDARD";

  const sentAt = Number(body?.sentAt);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(sentAt) || Math.abs(nowSec - sentAt) > MAX_CLOCK_SKEW_SECONDS) {
    return NextResponse.json({ error: "Stale or missing sentAt" }, { status: 400 });
  }

  const linked = await prisma.guildStaff.findFirst({
    where: { guildId: params.id, robloxUserId },
    select: { userId: true },
  });
  if (!linked) return NextResponse.json({ error: "Not a linked staff member" }, { status: 403 });

  const result = await ingestGameEvent(params.id, { type, robloxUserId, serverJobId, placeId: placeRaw, shiftType });
  return NextResponse.json({ ok: true, ...result });
}
