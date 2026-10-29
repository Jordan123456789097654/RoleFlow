import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

const STALE_MS = 3 * 60_000; // the daemon refreshes every minute; older than 3 minutes means it's not running

/** The bot's real connection state. "ONLINE" only when the daemon has checked in recently. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const g = await prisma.guild.findUnique({
    where: { id: params.id },
    select: { useCustomBot: true, customBotToken: true, botLiveStatus: true, botLiveStatusAt: true, botLiveMessage: true },
  });
  if (!g) return NextResponse.json({ error: "Community not found" }, { status: 404 });

  if (!g.useCustomBot || !g.customBotToken) {
    return NextResponse.json({ status: "NOT_CONFIGURED", message: "No bot is connected yet." }, { headers: { "Cache-Control": "no-store" } });
  }
  const fresh = g.botLiveStatusAt && Date.now() - g.botLiveStatusAt.getTime() < STALE_MS;
  if (!fresh) {
    return NextResponse.json(
      { status: "OFFLINE", message: "The bot is not connected right now. RoleFlow's bot service must be running to keep it online." },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    { status: g.botLiveStatus === "ONLINE" ? "ONLINE" : g.botLiveStatus || "OFFLINE", message: g.botLiveMessage, checkedAt: g.botLiveStatusAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}
