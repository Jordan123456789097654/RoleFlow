import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SURVEY_ID_PATTERN, surveyStatus, validateDepartureAnswer } from "@/lib/departure-survey";

export const dynamic = "force-dynamic";

/** Records the one-time answer for a departure survey. Nothing here is linked to a user. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!SURVEY_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  }

  const answer = validateDepartureAnswer(body);
  if (!answer.ok) {
    return NextResponse.json({ error: answer.error }, { status: 400 });
  }

  const survey = await prisma.departureSurvey.findUnique({ where: { id } });
  const status = surveyStatus(survey);
  if (status === "missing") return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  if (status === "expired") return NextResponse.json({ error: "This link has expired." }, { status: 410 });
  if (status === "answered") return NextResponse.json({ error: "You already answered this survey. Thank you." }, { status: 409 });

  // Conditional update: only one answer can win, even if two requests race.
  const updated = await prisma.departureSurvey.updateMany({
    where: { id, submittedAt: null },
    data: { reason: answer.data.reason, comment: answer.data.comment, submittedAt: new Date() },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "You already answered this survey. Thank you." }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
