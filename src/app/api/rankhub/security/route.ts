import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { unlockSecurity, triggerSecurityLockdown } from "@/lib/rankhub/anti-nuke";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId") || "15982012";

    let config = await prisma.rankHubSecurityConfig.findUnique({
      where: { groupId },
    });

    if (!config) {
      config = await prisma.rankHubSecurityConfig.create({
        data: {
          groupId,
          antiNukeEnabled: true,
          maxDemotionsPerMinute: 3,
          lockOnBreach: true,
          status: "NORMAL",
        },
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        groupId: config.groupId,
        antiNukeEnabled: config.antiNukeEnabled,
        maxDemotionsPerMinute: config.maxDemotionsPerMinute,
        lockOnBreach: config.lockOnBreach,
        notifyWebhookUrl: config.notifyWebhookUrl,
        status: config.status,
        lockedAt: config.lockedAt ? config.lockedAt.toISOString() : null,
        lockedReason: config.lockedReason,
        updatedAt: config.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch security config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser().catch(() => null);
    const body = await req.json();
    const { action, groupId = "15982012", antiNukeEnabled, maxDemotionsPerMinute, lockOnBreach, notifyWebhookUrl, reason } = body;

    if (action === "unlock") {
      const res = await unlockSecurity(groupId, user?.id || "admin");
      return NextResponse.json({
        success: true,
        message: "RankHub security unlocked. Ranking operations are back to NORMAL.",
        status: res.status,
      });
    }

    if (action === "lockdown") {
      const res = await triggerSecurityLockdown(groupId, reason || "Manual Emergency Lockdown triggered by administrator");
      return NextResponse.json({
        success: true,
        message: "RankHub emergency lockdown activated. All ranking operations halted.",
        status: res.status,
      });
    }

    // Default: update configuration
    const updated = await prisma.rankHubSecurityConfig.upsert({
      where: { groupId },
      update: {
        ...(antiNukeEnabled !== undefined && { antiNukeEnabled }),
        ...(maxDemotionsPerMinute !== undefined && { maxDemotionsPerMinute: Number(maxDemotionsPerMinute) }),
        ...(lockOnBreach !== undefined && { lockOnBreach }),
        ...(notifyWebhookUrl !== undefined && { notifyWebhookUrl: notifyWebhookUrl || null }),
      },
      create: {
        groupId,
        antiNukeEnabled: antiNukeEnabled !== undefined ? antiNukeEnabled : true,
        maxDemotionsPerMinute: maxDemotionsPerMinute !== undefined ? Number(maxDemotionsPerMinute) : 3,
        lockOnBreach: lockOnBreach !== undefined ? lockOnBreach : true,
        notifyWebhookUrl: notifyWebhookUrl || null,
        status: "NORMAL",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Security settings saved successfully.",
      config: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update security config" }, { status: 500 });
  }
}
