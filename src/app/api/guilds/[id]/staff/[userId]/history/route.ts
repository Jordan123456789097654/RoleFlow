import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { currentWeekWindow, shiftMinutesInWindow } from "@/lib/staff-roster";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

/** Minutes per week for one staff member, newest week first. Default 8 weeks, max 52. */
export async function GET(req: Request, { params }: { params: { id: string; userId: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;

  const requested = Number(new URL(req.url).searchParams.get("weeks") ?? 8);
  const weeks = Math.min(52, Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 8));

  const staff = await prisma.guildStaff.findFirst({
    where: { guildId: params.id, userId: params.userId },
    select: { robloxUserId: true },
  });
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  if (!staff.robloxUserId) return NextResponse.json({ weeks: [] });

  const now = new Date();
  const windows = Array.from({ length: weeks }, (_, i) =>
    currentWeekWindow(new Date(now.getTime() - i * 7 * DAY_MS))
  );
  const oldest = windows[windows.length - 1].start;

  const shifts = await prisma.shift.findMany({
    where: {
      guildId: params.id,
      robloxUserId: staff.robloxUserId,
      startedAt: { lt: now },
      OR: [{ endedAt: null }, { endedAt: { gte: oldest } }],
    },
    select: { startedAt: true, lastHeartbeatAt: true, endedAt: true },
  });

  const result = windows
    .map((w) => ({
      weekStart: w.start.toISOString(),
      minutes: shifts.reduce((sum, s) => sum + shiftMinutesInWindow(s, w, now), 0),
    }))
    .reverse();

  return NextResponse.json({ weeks: result });
}
