import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { getRobloxUserProfile } from "@/lib/roblox";

export const dynamic = "force-dynamic";

/**
 * Links a staff member's Roblox account. The Roblox account is required: every staff
 * member must be linked to a real Roblox user. Rank 0 means manual staff (no Roblox group).
 */
export async function PUT(req: Request, { params }: { params: { id: string; userId: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const robloxUserId = String(body?.robloxUserId ?? "").trim();
  if (!/^\d{1,20}$/.test(robloxUserId))
    return NextResponse.json({ error: "A Roblox user ID is required (numbers only)." }, { status: 400 });

  const rankRaw = body?.robloxRankId;
  const robloxRankId = rankRaw == null || rankRaw === "" ? 0 : Number(rankRaw);
  if (!Number.isInteger(robloxRankId) || robloxRankId < 0 || robloxRankId > 255)
    return NextResponse.json({ error: "robloxRankId must be 0-255" }, { status: 400 });

  const profile = await getRobloxUserProfile(robloxUserId);
  if (!profile) return NextResponse.json({ error: "No Roblox account found with that ID." }, { status: 400 });

  const updated = await prisma.guildStaff.updateMany({
    where: { guildId: params.id, userId: params.userId },
    data: { robloxUserId, robloxRankId },
  });
  if (updated.count === 0) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  return NextResponse.json({ ok: true, robloxName: profile.name });
}
