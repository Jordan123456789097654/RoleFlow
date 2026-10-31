import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionValue } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isSiteAdminUser } from "@/lib/roles";
import { broadcastLaunchDelayEmail } from "@/lib/broadcast-delay";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/broadcast-delay
 * Sends launch delay announcement to all registered emails (personal, company, newsletter, notify)
 * from noreply@roleflow.site, and automatically updates the lockdown countdown target time.
 */
export async function POST(request: Request) {
  // Check authorization (admin session or CRON_SECRET / APP_SECRET)
  const authHeader = request.headers.get("authorization")?.replace("Bearer ", "");
  const body = await request.json().catch(() => ({}));
  const secret = body.secret || authHeader;

  let isAuthorized = false;

  if (process.env.CRON_SECRET && secret === process.env.CRON_SECRET) {
    isAuthorized = true;
  } else if (process.env.APP_SECRET && secret === process.env.APP_SECRET) {
    isAuthorized = true;
  } else {
    const userId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isSiteAdmin: true, siteRole: true },
      });
      if (user && isSiteAdminUser(user)) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Target: Sunday, November 1st at 6:00 PM EDT (UTC-4) -> 22:00:00 UTC
  // 2026-11-01T18:00:00-04:00 is 2026-11-01T22:00:00.000Z
  const newTargetIso = new Date("2026-11-01T18:00:00-04:00").toISOString();

  // 1. Update system countdown target in database
  await prisma.systemSetting.upsert({
    where: { key: "lockdown_countdown" },
    update: { value: newTargetIso },
    create: { key: "lockdown_countdown", value: newTargetIso },
  });

  await prisma.systemSetting.upsert({
    where: { key: "lockdown_active" },
    update: { value: "true" },
    create: { key: "lockdown_active", value: "true" },
  });

  // Reset launch broadcast flag so the unlock email can fire on Sunday at 6 PM
  await prisma.systemSetting.upsert({
    where: { key: "lockdown_broadcast_sent" },
    update: { value: "false" },
    create: { key: "lockdown_broadcast_sent", value: "false" },
  });

  // 2. Dispatch delay email broadcast
  const results = await broadcastLaunchDelayEmail();

  return NextResponse.json({
    success: true,
    message: `Delay announcement dispatched to ${results.sent} of ${results.totalFound} recipients from noreply@roleflow.site.`,
    newTargetIso,
    results,
  });
}
