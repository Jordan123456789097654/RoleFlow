import { NextResponse } from "next/server";
import { broadcastAllEmailsLaunchUpdate } from "@/lib/broadcast-launch";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.headers.get("authorization")?.replace("Bearer ", "");

    // Allow cron secret or trigger from client countdown completion
    const isCron = Boolean(process.env.CRON_SECRET && secret === process.env.CRON_SECRET);
    const isClientTrigger = body.trigger === "countdown_complete";

    if (!isCron && !isClientTrigger) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify countdown has passed
    const countdownSetting = await prisma.systemSetting.findUnique({
      where: { key: "lockdown_countdown" },
    });
    
    if (countdownSetting?.value) {
      const targetTime = new Date(countdownSetting.value).getTime();
      if (Date.now() < targetTime) {
        return NextResponse.json({ error: "Countdown has not reached zero yet." }, { status: 400 });
      }
    }

    // Disable lockdown in system setting once done
    await prisma.systemSetting.upsert({
      where: { key: "lockdown_active" },
      update: { value: "false" },
      create: { key: "lockdown_active", value: "false" },
    });

    // Check if broadcast was already executed to prevent re-blasting
    const alreadySent = await prisma.systemSetting.findUnique({
      where: { key: "lockdown_broadcast_sent" },
    });

    if (alreadySent?.value === "true") {
      return NextResponse.json({ success: true, message: "Broadcast already delivered." });
    }

    // Dispatch broadcast email to all collected emails across the database
    const results = await broadcastAllEmailsLaunchUpdate();

    await prisma.systemSetting.upsert({
      where: { key: "lockdown_broadcast_sent" },
      update: { value: "true" },
      create: { key: "lockdown_broadcast_sent", value: "true" },
    });

    return NextResponse.json({
      success: true,
      message: `Launch emails sent to ${results.sent} of ${results.totalFound} total addresses.`,
      results,
    });
  } catch (err) {
    console.error("Launch broadcast error:", err);
    return NextResponse.json({ error: "Failed to broadcast update" }, { status: 500 });
  }
}
