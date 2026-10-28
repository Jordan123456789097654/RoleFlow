import { recordAudit } from "@/lib/audit";
import { authorizeGuild } from "@/lib/guild-access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const __a = await authorizeGuild(params.id, "manage"); if (!__a.ok) return __a.response;
  await recordAudit({ actorId: __a.userId, action: "GUILD_BLACKLIST_CHANGE", targetId: params.id });
  try {
    const { targetType, targetValue, reason } = await request.json();

    if (!targetValue) {
      return NextResponse.json({ error: "Target value required" }, { status: 400 });
    }

    const item = await prisma.blacklist.create({
      data: {
        guildId: params.id,
        targetType: targetType || "DISCORD_ID",
        targetValue,
        reason,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (err) {
    return NextResponse.json({ error: "Failed to blacklist" }, { status: 500 });
  }
}
