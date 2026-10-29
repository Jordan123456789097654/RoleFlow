import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Archives decided applications for communities that set an auto-archive window.
 * Call on a schedule (e.g. daily) with: Authorization: Bearer $CRON_SECRET
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guilds = await prisma.guild.findMany({ where: { autoArchiveDays: { gt: 0 } }, select: { id: true, autoArchiveDays: true } });
  let archived = 0;
  for (const g of guilds) {
    const cutoff = new Date(Date.now() - g.autoArchiveDays * 24 * 60 * 60 * 1000);
    const res = await prisma.application.updateMany({
      where: { position: { guildId: g.id }, archivedAt: null, status: { in: ["ACCEPTED", "REJECTED"] }, updatedAt: { lt: cutoff } },
      data: { archivedAt: new Date() },
    });
    archived += res.count;
  }
  return NextResponse.json({ success: true, communities: guilds.length, archived });
}

export const GET = run;
export const POST = run;
