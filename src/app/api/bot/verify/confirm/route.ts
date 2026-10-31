import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBotAuth } from "@/lib/bot-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authErr = checkBotAuth(request);
  if (authErr) return authErr;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { discordId } = body || {};
  if (!discordId) {
    return NextResponse.json({ error: "discordId is required" }, { status: 400 });
  }

  // Lookup active verification record for discordId
  const activeSafeword = await prisma.robloxVerificationSafeword.findFirst({
    where: {
      discordUserId: String(discordId),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activeSafeword) {
    return NextResponse.json(
      { success: false, reason: "NO_ACTIVE_VERIFICATION", message: "No active verification request found or expired." },
      { status: 404 }
    );
  }

  const { robloxUserId, robloxUsername, safeword } = activeSafeword;

  // Fetch Roblox user profile details (including bio/description)
  let description = "";
  try {
    const profileRes = await fetch(`https://users.roblox.com/v1/users/${robloxUserId}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      description = profileData?.description || "";
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch Roblox profile bio" }, { status: 502 });
  }

  // Check if bio contains safeword
  if (!description.includes(safeword)) {
    return NextResponse.json({
      success: false,
      reason: "SAFEWORD_NOT_FOUND",
      expectedSafeword: safeword,
    });
  }

  // Safeword confirmed! Fetch avatar thumbnail if available
  let robloxAvatar: string | null = null;
  try {
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUserId}&size=150x150&format=Png&isCircular=false`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (avatarRes.ok) {
      const avatarData = await avatarRes.json();
      robloxAvatar = avatarData?.data?.[0]?.imageUrl || null;
    }
  } catch {
    // Non-fatal
  }

  // Upsert User linking robloxId, robloxUsername, robloxAvatar
  const user = await prisma.user.upsert({
    where: { id: String(discordId) },
    update: {
      robloxId: robloxUserId,
      robloxUsername,
      ...(robloxAvatar ? { robloxAvatar } : {}),
    },
    create: {
      id: String(discordId),
      username: robloxUsername,
      robloxId: robloxUserId,
      robloxUsername,
      robloxAvatar,
    },
  });

  // Delete used safeword(s) for this user
  await prisma.robloxVerificationSafeword.deleteMany({
    where: { discordUserId: String(discordId) },
  });

  return NextResponse.json({
    success: true,
    robloxId: robloxUserId,
    robloxUsername,
    userId: user.id,
  });
}
