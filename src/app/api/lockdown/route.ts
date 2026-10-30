import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Default lockdown target: Today at 9:00 PM EDT (01:00 UTC)
const DEFAULT_TARGET = "2026-10-31T01:00:00.000Z";

export async function GET() {
  try {
    const [activeSetting, targetSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "lockdown_active" } }),
      prisma.systemSetting.findUnique({ where: { key: "lockdown_countdown" } }),
    ]);

    // Active by default until target time is reached
    const targetDate = targetSetting?.value || DEFAULT_TARGET;
    const targetTime = new Date(targetDate).getTime();
    const isPast = Date.now() >= targetTime;

    const isActive = activeSetting ? activeSetting.value === "true" : !isPast;

    return NextResponse.json({
      active: isActive && !isPast,
      targetDate,
      isPast,
    });
  } catch (err) {
    return NextResponse.json({
      active: true,
      targetDate: DEFAULT_TARGET,
      isPast: false,
    });
  }
}
