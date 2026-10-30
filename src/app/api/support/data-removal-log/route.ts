import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupportCaller } from "@/lib/staff-access";
import { REMOVAL_ITEM_LABELS } from "@/lib/support-reports";

export const dynamic = "force-dynamic";

/** The data removal log. Filter with ?subject=<username or user id>. */
export async function GET(request: Request) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const subject = new URL(request.url).searchParams.get("subject")?.trim();
  const where = subject ? { OR: [{ subjectUserId: subject }, { subjectUsername: { contains: subject, mode: "insensitive" as const } }] } : {};
  const entries = await prisma.dataRemovalLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 300 });
  return NextResponse.json({ entries, labels: REMOVAL_ITEM_LABELS });
}

/** Record a removal that was done outside this site, for example by a developer on the database. */
export async function POST(request: Request) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const subject = String(body?.subject ?? "").trim();
  const item = String(body?.item ?? "");
  const reason = String(body?.reason ?? "").trim();
  if (!subject) return NextResponse.json({ error: "Enter the user." }, { status: 400 });
  if (!REMOVAL_ITEM_LABELS[item]) return NextResponse.json({ error: "Choose what was removed." }, { status: 400 });
  if (reason.length < 10) return NextResponse.json({ error: "Give a reason of at least 10 characters." }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { OR: [{ id: subject }, { username: subject }] }, select: { id: true, username: true } });
  const entry = await prisma.dataRemovalLog.create({
    data: {
      subjectUserId: user?.id ?? subject,
      subjectUsername: user?.username ?? subject,
      item,
      method: "RECORDED_ONLY",
      reason,
      ticketRef: body?.ticketRef ? String(body.ticketRef).trim().slice(0, 100) : null,
      actorId: caller.id,
      actorName: caller.username,
    },
  });
  return NextResponse.json({ success: true, entry });
}
