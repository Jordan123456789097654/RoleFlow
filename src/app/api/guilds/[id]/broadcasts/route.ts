import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { recordAudit } from "@/lib/audit";
import { BROADCAST_COOLDOWN_MS, getLiveServers, getRecentBroadcasts, sanitizeBroadcast } from "@/lib/live-ops";

export const dynamic = "force-dynamic";

/** Recent broadcasts with delivery counts. Owners and site admins only. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const items = await getRecentBroadcasts(params.id);
  return NextResponse.json({
    broadcasts: items.map((b) => ({ id: b.id, message: b.message, createdAt: b.createdAt, delivered: b._count.receipts })),
  });
}

/**
 * Sends a notice to every live server. Requires confirm: true, a 10-minute cooldown,
 * and at least one live server. Owners and site admins only. Every send is audit-logged.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  if (body?.confirm !== true) return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
  const message = sanitizeBroadcast(body?.message);
  if (!message) return NextResponse.json({ error: "Message must be 1-200 characters of plain text." }, { status: 400 });

  const now = new Date();
  const last = await prisma.broadcast.findFirst({
    where: { guildId: params.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (last && now.getTime() - last.createdAt.getTime() < BROADCAST_COOLDOWN_MS) {
    const wait = Math.ceil((BROADCAST_COOLDOWN_MS - (now.getTime() - last.createdAt.getTime())) / 1000);
    return NextResponse.json({ error: `Wait ${Math.ceil(wait / 60)} more minute(s) between broadcasts.`, retryAfter: wait }, { status: 429 });
  }

  const live = await getLiveServers(params.id, now);
  if (live.length === 0) return NextResponse.json({ error: "No live servers to send to." }, { status: 409 });

  const created = await prisma.broadcast.create({
    data: { guildId: params.id, message, createdById: access.userId },
    select: { id: true },
  });
  await recordAudit({
    actorId: access.userId,
    action: "BROADCAST_SENT",
    targetId: params.id,
    details: { broadcastId: created.id, message, liveServers: live.length },
  });
  return NextResponse.json({ ok: true, id: created.id, liveServers: live.length });
}
