import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDeadlineReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Sends each open position's closing-soon reminder once, to applicants who saved it or
 * started a draft but haven't applied. A daily call covers every position, because the
 * window is 24 hours long. Call with: Authorization: Bearer $CRON_SECRET
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const positions = await prisma.position.findMany({
    where: {
      isOpen: true,
      deadlineReminderSentAt: null,
      closesAt: { gt: now, lte: new Date(now.getTime() + WINDOW_MS) },
    },
    select: { id: true, title: true, closesAt: true, guild: { select: { name: true } } },
  });

  let sent = 0;
  let failed = 0;

  for (const p of positions) {
    const [saved, drafts, applied] = await Promise.all([
      prisma.savedPosition.findMany({ where: { positionId: p.id }, select: { userId: true } }),
      prisma.applicationDraft.findMany({ where: { positionId: p.id }, select: { userId: true } }),
      prisma.application.findMany({ where: { positionId: p.id }, select: { userId: true } }),
    ]);

    const appliedIds = new Set(applied.map((a) => a.userId));
    const recipientIds = [...new Set([...saved, ...drafts].map((r) => r.userId))].filter((id) => !appliedIds.has(id));

    const users = await prisma.user.findMany({
      where: { id: { in: recipientIds }, email: { not: null }, emailNotifications: true },
      select: { email: true, username: true },
    });

    for (const u of users) {
      if (!u.email) continue;
      const res = await sendDeadlineReminderEmail({
        toEmail: u.email,
        applicantName: u.username,
        communityName: p.guild.name,
        positionTitle: p.title,
        closesAt: p.closesAt!,
        positionId: p.id,
      });
      if (res.success) sent++;
      else failed++;
    }

    // Mark the position done even if some sends failed, so applicants don't get repeat emails.
    await prisma.position.update({ where: { id: p.id }, data: { deadlineReminderSentAt: now } });
  }

  return NextResponse.json({ success: true, positionsReminded: positions.length, emailsSent: sent, emailsFailed: failed });
}

export const GET = run;
export const POST = run;
