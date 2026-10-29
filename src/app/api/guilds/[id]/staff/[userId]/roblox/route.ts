import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

/** Links a staff member's Roblox account and cached group rank. Owner or site admin only. */
export async function PUT(req: Request, { params }: { params: { id: string; userId: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const robloxUserId = body?.robloxUserId == null || body.robloxUserId === "" ? null : String(body.robloxUserId).trim();
  if (robloxUserId !== null && !/^\d{1,20}$/.test(robloxUserId))
    return NextResponse.json({ error: "robloxUserId must be numeric" }, { status: 400 });

  const rankRaw = body?.robloxRankId;
  const robloxRankId = rankRaw == null || rankRaw === "" ? null : Number(rankRaw);
  if (robloxRankId !== null && (!Number.isInteger(robloxRankId) || robloxRankId < 1 || robloxRankId > 255))
    return NextResponse.json({ error: "robloxRankId must be 1-255" }, { status: 400 });

  const updated = await prisma.guildStaff.updateMany({
    where: { guildId: params.id, userId: params.userId },
    data: { robloxUserId, robloxRankId },
  });
  if (updated.count === 0) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
