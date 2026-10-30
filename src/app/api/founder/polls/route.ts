import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { validatePollInput } from "@/lib/polls";

export const dynamic = "force-dynamic";

/** Founder only: every poll, with the written "other" answers so the founder can read them. */
export async function GET() {
  if (!(await getFounderCaller())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { options: { orderBy: { order: "asc" } }, votes: { select: { optionId: true, otherText: true, updatedAt: true } } },
  });
  return NextResponse.json({
    polls: polls.map((p) => ({
      id: p.id,
      question: p.question,
      description: p.description,
      status: p.status,
      allowOther: p.allowOther,
      otherLabel: p.otherLabel,
      closesAt: p.closesAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      totalVotes: p.votes.length,
      options: p.options.map((o) => ({ id: o.id, label: o.label, votes: p.votes.filter((v) => v.optionId === o.id).length })),
      otherResponses: p.votes.filter((v) => v.otherText).map((v) => ({ text: v.otherText, at: v.updatedAt.toISOString() })),
    })),
  });
}

/** Founder only: create a poll. */
export async function POST(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const checked = validatePollInput(await request.json().catch(() => null));
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const v = checked.value;
  const poll = await prisma.poll.create({
    data: {
      question: v.question,
      description: v.description,
      allowOther: v.allowOther,
      otherLabel: v.otherLabel,
      closesAt: v.closesAt,
      createdById: caller.id,
      options: { create: v.options.map((label, order) => ({ label, order })) },
    },
  });
  await recordAudit({ actorId: caller.id, action: "POLL_CREATE", targetId: poll.id, details: { question: v.question, options: v.options.length } });
  return NextResponse.json({ success: true, id: poll.id });
}

/** Founder only: close or reopen a poll. */
export async function PATCH(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const status = body?.status === "CLOSED" ? "CLOSED" : body?.status === "OPEN" ? "OPEN" : null;
  if (!body?.id || !status) return NextResponse.json({ error: "Choose a poll and a status." }, { status: 400 });
  await prisma.poll.update({ where: { id: String(body.id) }, data: { status, closesAt: status === "CLOSED" ? new Date() : null } });
  await recordAudit({ actorId: caller.id, action: "POLL_STATUS", targetId: String(body.id), details: { status } });
  return NextResponse.json({ success: true });
}

/** Founder only: delete a poll and all its votes. */
export async function DELETE(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Choose a poll." }, { status: 400 });
  await prisma.poll.delete({ where: { id } });
  await recordAudit({ actorId: caller.id, action: "POLL_DELETE", targetId: id });
  return NextResponse.json({ success: true });
}
