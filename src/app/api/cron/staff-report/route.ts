import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInactivityReport } from "@/lib/staff-report";

export const dynamic = "force-dynamic";

/**
 * Emails last week's quota report to each linked community's owner.
 * Schedule daily with: Authorization: Bearer $CRON_SECRET. It only sends on Mondays (UTC),
 * and each community receives at most one report per week.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  if (now.getUTCDay() !== 1) return NextResponse.json({ ok: true, skipped: "not Monday (UTC)" });

  const guilds = await prisma.guild.findMany({
    where: { robloxGroupId: { not: null } },
    select: { id: true },
  });
  const outcomes: Record<string, number> = {};
  for (const g of guilds) {
    const outcome = await sendInactivityReport(g.id, now);
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
  }
  return NextResponse.json({ ok: true, outcomes });
}
