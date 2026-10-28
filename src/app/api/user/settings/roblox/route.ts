import { isFeatureEnabled } from "@/lib/feature-flags";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isFeatureEnabled("roblox_linking"))) {
    return NextResponse.json({ error: "Roblox linking is currently unavailable." }, { status: 404 });
  }
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { robloxUsername } = await request.json();

    if (!robloxUsername || !robloxUsername.trim()) {
      // Clear Roblox link
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          robloxUsername: null,
          robloxId: null,
          robloxAvatar: null,
        },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    const cleanName = robloxUsername.trim();

    // Fetch Roblox user details using Roblox API
    let rbxId = null;
    let rbxAvatar = null;

    try {
      const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [cleanName],
          excludeBannedUsers: false,
        }),
      });

      if (userRes.ok) {
        const uData = await userRes.json();
        if (uData.data?.length > 0) {
          rbxId = String(uData.data[0].id);

          // Fetch avatar headshot
          const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${rbxId}&size=150x150&format=Png&isCircular=false`
          );
          if (thumbRes.ok) {
            const tData = await thumbRes.json();
            if (tData.data?.length > 0) {
              rbxAvatar = tData.data[0].imageUrl;
            }
          }
        }
      }
    } catch (e) {}

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        robloxUsername: cleanName,
        robloxId: rbxId,
        robloxAvatar: rbxAvatar,
      },
    });

    return NextResponse.json({
      success: true,
      robloxUsername: updated.robloxUsername,
      robloxAvatar: updated.robloxAvatar,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
