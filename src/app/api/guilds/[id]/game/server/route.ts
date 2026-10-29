import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clockOk, requireGameSecret, validDigits, validJobId } from "@/lib/game-request";

export const dynamic = "force-dynamic";

/** A game server reports its status every 30 seconds. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireGameSecret(params.id, req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const serverJobId = validJobId(body?.serverJobId);
  if (!serverJobId) return NextResponse.json({ error: "Bad serverJobId" }, { status: 400 });
  if (!clockOk(body?.sentAt)) return NextResponse.json({ error: "Stale or missing sentAt" }, { status: 400 });

  const placeId = validDigits(body?.placeId);
  const playerCount = Number(body?.playerCount);
  const maxPlayers = Number(body?.maxPlayers);
  const ping = body?.averagePingMs == null ? null : Number(body.averagePingMs);
  if (!Number.isInteger(playerCount) || playerCount < 0 || playerCount > 1000)
    return NextResponse.json({ error: "Bad playerCount" }, { status: 400 });
  if (!Number.isInteger(maxPlayers) || maxPlayers < 0 || maxPlayers > 1000)
    return NextResponse.json({ error: "Bad maxPlayers" }, { status: 400 });
  if (ping !== null && (!Number.isInteger(ping) || ping < 0 || ping > 60_000))
    return NextResponse.json({ error: "Bad averagePingMs" }, { status: 400 });

  const now = new Date();
  const reportedStart = Number(body?.startedAt);
  const startedAt =
    Number.isFinite(reportedStart) && reportedStart > 0 && reportedStart * 1000 <= now.getTime()
      ? new Date(reportedStart * 1000)
      : now;

  await prisma.gameServer.upsert({
    where: { guildId_serverJobId: { guildId: params.id, serverJobId } },
    create: { guildId: params.id, serverJobId, placeId, playerCount, maxPlayers, averagePingMs: ping, startedAt, lastSeenAt: now },
    update: { placeId, playerCount, maxPlayers, averagePingMs: ping, lastSeenAt: now },
  });
  return NextResponse.json({ ok: true });
}
