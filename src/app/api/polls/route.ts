import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isPollOpen } from "@/lib/polls";

export const dynamic = "force-dynamic";

/** Open polls, plus the five most recently closed. Results (counts) show to everyone after they vote or once the poll is closed. */
export async function GET() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  const polls = await prisma.poll.findMany({
    where: { OR: [{ status: "OPEN" }, { status: "CLOSED" }] },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { options: { orderBy: { order: "asc" } }, votes: { select: { userId: true, optionId: true, otherText: true } } },
  });

  const shaped = polls
    .map((p) => ({ p, open: isPollOpen(p) }))
    .filter((x, i, all) => x.open || all.slice(0, i).filter((y) => !y.open).length < 5)
    .slice(0, 30)
    .map(({ p, open }) => {
      const mine = userId ? p.votes.find((v) => v.userId === userId) : undefined;
      const showResults = !open || !!mine;
      return {
        id: p.id,
        question: p.question,
        description: p.description,
        open,
        closesAt: p.closesAt?.toISOString() ?? null,
        allowOther: p.allowOther,
        otherLabel: p.otherLabel,
        totalVotes: p.votes.length,
        options: p.options.map((o) => ({
          id: o.id,
          label: o.label,
          votes: showResults ? p.votes.filter((v) => v.optionId === o.id).length : null,
        })),
        otherVotes: showResults && p.allowOther ? p.votes.filter((v) => v.otherText).length : null,
        myVote: mine ? { optionId: mine.optionId, otherText: mine.otherText } : null,
        signedIn: !!userId,
      };
    });

  return NextResponse.json({ polls: shaped });
}
