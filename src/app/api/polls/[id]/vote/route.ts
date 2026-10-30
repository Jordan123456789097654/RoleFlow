import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isPollOpen, POLL_LIMITS } from "@/lib/polls";

export const dynamic = "force-dynamic";

/** Sign-in is required. A vote is either one of the options or, when the poll allows it, the "other" answer. Voting again changes the vote. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const poll = await prisma.poll.findUnique({ where: { id: params.id }, include: { options: { select: { id: true } } } });
  if (!poll) return NextResponse.json({ error: "Poll not found." }, { status: 404 });
  if (!isPollOpen(poll)) return NextResponse.json({ error: "This poll is closed." }, { status: 400 });

  const optionId = typeof body?.optionId === "string" ? body.optionId : null;
  const otherText = typeof body?.otherText === "string" ? body.otherText.trim() : "";

  let data: { optionId: string | null; otherText: string | null };
  if (optionId) {
    if (!poll.options.some((o) => o.id === optionId)) return NextResponse.json({ error: "That option is not part of this poll." }, { status: 400 });
    data = { optionId, otherText: null };
  } else if (otherText) {
    if (!poll.allowOther) return NextResponse.json({ error: "This poll does not take other answers." }, { status: 400 });
    if (otherText.length > POLL_LIMITS.otherText) return NextResponse.json({ error: `Keep your answer under ${POLL_LIMITS.otherText} characters.` }, { status: 400 });
    data = { optionId: null, otherText };
  } else {
    return NextResponse.json({ error: "Choose an option first." }, { status: 400 });
  }

  await prisma.pollVote.upsert({
    where: { pollId_userId: { pollId: poll.id, userId } },
    create: { pollId: poll.id, userId, ...data },
    update: data,
  });
  return NextResponse.json({ success: true });
}
