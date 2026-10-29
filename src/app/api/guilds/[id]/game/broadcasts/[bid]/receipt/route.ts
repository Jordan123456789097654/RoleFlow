import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGameSecret, validJobId } from "@/lib/game-request";

export const dynamic = "force-dynamic";

/** A game server confirms it displayed a broadcast. Used for the delivery count. */
export async function POST(req: Request, { params }: { params: { id: string; bid: string } }) {
  const denied = await requireGameSecret(params.id, req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const serverJobId = validJobId(body?.serverJobId);
  if (!serverJobId) return NextResponse.json({ error: "Bad serverJobId" }, { status: 400 });

  const broadcast = await prisma.broadcast.findFirst({ where: { id: params.bid, guildId: params.id }, select: { id: true } });
  if (!broadcast) return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });

  await prisma.broadcastReceipt.upsert({
    where: { broadcastId_serverJobId: { broadcastId: broadcast.id, serverJobId } },
    create: { broadcastId: broadcast.id, serverJobId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
