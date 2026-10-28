import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Assign one application to a reviewer, set a review deadline, or flag it for a second opinion. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    select: { id: true, position: { select: { guildId: true, guild: { select: { ownerId: true } } } } },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const access = await authorizeGuild(application.position.guildId, "decide");
  if (!access.ok) return access.response;

  const body = await request.json();
  const reviewerId = body.reviewerId ? String(body.reviewerId) : null;
  if (reviewerId) {
    const staff = await prisma.guildStaff.findUnique({
      where: { guildId_userId: { guildId: application.position.guildId, userId: reviewerId } },
      select: { id: true },
    });
    if (!staff && application.position.guild.ownerId !== reviewerId) {
      return NextResponse.json({ error: "Reviewers must be the owner or a member of the staff team." }, { status: 400 });
    }
  }

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: {
      assignedReviewerId: reviewerId,
      reviewDueAt: body.reviewDueAt ? new Date(body.reviewDueAt) : null,
      ...(typeof body.needsSecondOpinion === "boolean" ? { needsSecondOpinion: body.needsSecondOpinion } : {}),
    },
  });
  await recordAudit({
    actorId: access.userId,
    action: "APPLICATION_ASSIGN",
    targetId: application.id,
    details: { reviewerId, reviewDueAt: body.reviewDueAt ?? null, needsSecondOpinion: body.needsSecondOpinion ?? null },
  });
  return NextResponse.json({ success: true, application: updated });
}
