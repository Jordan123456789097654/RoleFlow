import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBotAuth } from "@/lib/bot-auth";
import { generateSafeword } from "@/lib/safeword";

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

  const { discordId, robloxUsername } = body || {};
  if (!discordId || !robloxUsername || typeof robloxUsername !== "string") {
    return NextResponse.json({ error: "discordId and robloxUsername are required" }, { status: 400 });
  }

  const cleanUsername = robloxUsername.trim();
  if (!cleanUsername) {
    return NextResponse.json({ error: "Roblox username cannot be empty" }, { status: 400 });
  }

  // Lookup Roblox user
  try {
    const robloxRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        usernames: [cleanUsername],
        excludeBannedUsers: false,
      }),
    });

    if (!robloxRes.ok) {
      return NextResponse.json({ error: "Failed to communicate with Roblox API" }, { status: 502 });
    }

    const robloxData = await robloxRes.json();
    const userMatch = robloxData?.data?.[0];

    if (!userMatch || !userMatch.id) {
      return NextResponse.json({ error: "Roblox user not found" }, { status: 400 });
    }

    const robloxId = String(userMatch.id);
    const exactUsername = userMatch.name || cleanUsername;

    const safeword = generateSafeword();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute expiration

    // Invalidate/delete any previous active safewords for this Discord user
    await prisma.robloxVerificationSafeword.deleteMany({
      where: { discordUserId: String(discordId) },
    });

    await prisma.robloxVerificationSafeword.create({
      data: {
        discordUserId: String(discordId),
        robloxUserId: robloxId,
        robloxUsername: exactUsername,
        safeword,
        expiresAt,
      },
    });

    return NextResponse.json({
      robloxId,
      robloxUsername: exactUsername,
      safeword,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
