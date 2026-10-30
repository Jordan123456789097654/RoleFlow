import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Downloads everything RoleFlow stores about the signed-in user across all products. */
export async function GET() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    user,
    applications,
    messages,
    reviews,
    communityReviews,
    savedPositions,
    drafts,
    pollVotes,
    feedbackReports,
    contentReports,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        email: true,
        emailNotifications: true,
        robloxId: true,
        robloxUsername: true,
        plan: true,
        isSiteAdmin: true,
        createdAt: true,
      },
    }),
    prisma.application.findMany({
      where: { userId },
      include: { answers: true },
    }),
    prisma.applicationMessage.findMany({ where: { senderId: userId } }),
    prisma.review.findMany({ where: { reviewerId: userId } }),
    prisma.communityReview.findMany({ where: { userId } }),
    prisma.savedPosition.findMany({ where: { userId } }),
    prisma.applicationDraft.findMany({ where: { userId } }),
    prisma.pollVote.findMany({ where: { userId } }),
    prisma.feedbackReport.findMany({ where: { authorId: userId } }),
    prisma.contentReport.findMany({ where: { reporterId: userId } }),
  ]);

  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      user,
      applications,
      messages,
      reviews,
      communityReviews,
      savedPositions,
      drafts,
      pollVotes,
      feedbackReports,
      contentReports,
    },
    null,
    2
  );

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="roleflow-data-${userId}.json"`,
    },
  });
}
