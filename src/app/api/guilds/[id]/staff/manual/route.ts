import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { getRobloxUserProfile } from "@/lib/roblox";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Adds a staff member by hand, for communities without a Roblox group.
 * Roblox account is required. Discord ID is optional; without one, the person is
 * tracked but cannot sign in to the dashboard.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const displayName = String(body?.displayName ?? "").trim();
  if (!displayName || displayName.length > 64)
    return NextResponse.json({ error: "Name is required (max 64 characters)." }, { status: 400 });

  const robloxUserId = String(body?.robloxUserId ?? "").trim();
  if (!/^\d{1,20}$/.test(robloxUserId))
    return NextResponse.json({ error: "A Roblox user ID is required (numbers only)." }, { status: 400 });

  const rankRaw = body?.robloxRankId;
  const robloxRankId = rankRaw == null || rankRaw === "" ? 0 : Number(rankRaw);
  if (!Number.isInteger(robloxRankId) || robloxRankId < 0 || robloxRankId > 255)
    return NextResponse.json({ error: "Rank must be 0-255." }, { status: 400 });

  const roleTitle = String(body?.roleTitle ?? "").trim().slice(0, 64) || "Staff";

  const discordUserId = String(body?.discordUserId ?? "").trim();
  if (discordUserId && !/^\d{5,20}$/.test(discordUserId))
    return NextResponse.json({ error: "Discord ID must be numbers only." }, { status: 400 });

  const profile = await getRobloxUserProfile(robloxUserId);
  if (!profile) return NextResponse.json({ error: "No Roblox account found with that ID." }, { status: 400 });

  const userId = discordUserId || `manual:${randomBytes(9).toString("hex")}`;
  try {
    await prisma.guildStaff.create({
      data: { guildId: params.id, userId, username: displayName, roleTitle, robloxUserId, robloxRankId, permissions: "vote_only" },
    });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "That person is already on the staff list." }, { status: 409 });
    throw e;
  }

  await recordAudit({
    actorId: access.userId,
    action: "STAFF_ADDED_MANUAL",
    targetId: params.id,
    details: { userId, robloxUserId, robloxRankId },
  });
  return NextResponse.json({ ok: true, userId, robloxName: profile.name });
}
