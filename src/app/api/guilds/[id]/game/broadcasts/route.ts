import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGameSecret, validJobId } from "@/lib/game-request";
import { BROADCAST_VISIBLE_MS } from "@/lib/live-ops";

export const dynamic = "force-dynamic";

/**
 * Broadcasts a game server has not seen yet. Pass since=<unix seconds> with the last
 * createdAtUnix the server received, so each message is delivered once per server.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireGameSecret(params.id, req);
  if (denied) return denied;

  const url = new URL(req.url);
  const serverJobId = validJobId(url.searchParams.get("serverJobId"));
  if (!serverJobId) return NextResponse.json({ error: "Bad serverJobId" }, { status: 400 });

  const sinceSec = Number(url.searchParams.get("since") ?? 0);
  const now = Date.now();
  const sinceMs = Number.isFinite(sinceSec) ? sinceSec * 1000 : 0;
  const floor = new Date(Math.max(sinceMs, now - BROADCAST_VISIBLE_MS));

  const list = await prisma.broadcast.findMany({
    where: { guildId: params.id, createdAt: { gt: floor } },
    orderBy: { createdAt: "asc" },
    select: { id: true, message: true, createdAt: true },
  });
  return NextResponse.json({
    broadcasts: list.map((b) => ({
      id: b.id,
      message: b.message,
      createdAtUnix: Math.floor(b.createdAt.getTime() / 1000),
    })),
  });
}
