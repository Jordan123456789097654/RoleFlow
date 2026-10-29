import { isFounderId } from "@/lib/roles";
import { syncBanFlag } from "@/lib/bans";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendModerationNoticeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || isFounderId(currentUser?.id);

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const blacklists = await prisma.globalBlacklist.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(blacklists);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch global blacklist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || isFounderId(currentUser?.id);

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { targetType, targetValue, reason } = await request.json();

    if (!targetValue) {
      return NextResponse.json({ error: "Target value (Discord ID or Roblox User) is required" }, { status: 400 });
    }

    const entry = await prisma.globalBlacklist.create({
      data: {
        targetType: targetType || "DISCORD_ID",
        targetValue: targetValue.trim(),
        reason: reason?.trim() || "Violated platform acceptable use policies",
      },
    });

    // If targetType is DISCORD_ID, mark user as isBanned and dispatch moderation notice email
    if (targetType === "DISCORD_ID") {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetValue.trim() },
      });

      await prisma.user.updateMany({
        where: { id: targetValue.trim() },
        data: { isBanned: true, sessionVersion: { increment: 1 } },
      });

      if (targetUser && targetUser.email) {
        sendModerationNoticeEmail({
          toEmail: targetUser.email,
          username: targetUser.username,
          actionType: "BLACKLIST",
          reason: reason?.trim() || "Violated platform acceptable use policies",
        }).catch((e) => console.warn("Moderation notice email failed:", e));
      }
    }

    return NextResponse.json({ success: true, entry });
  } catch (err) {
    console.error("Global blacklist create error:", err);
    return NextResponse.json({ error: "Failed to add to blacklist" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || isFounderId(currentUser?.id);

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const entry = await prisma.globalBlacklist.findUnique({ where: { id } });
    if (entry && entry.targetType === "DISCORD_ID") {
      await syncBanFlag(entry.targetValue);
    }

    await prisma.globalBlacklist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Global blacklist delete error:", err);
    return NextResponse.json({ error: "Failed to remove from blacklist" }, { status: 500 });
  }
}
