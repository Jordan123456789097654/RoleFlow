import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { comment, score } = await request.json();

    if (!comment && score === undefined) {
      return NextResponse.json({ error: "Comment or vote score is required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        position: {
          include: { guild: true },
        },
        reviews: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if this reviewer already reviewed/voted
    const existing = await prisma.review.findFirst({
      where: {
        applicationId: params.id,
        reviewerId: user.id,
      },
    });

    let review;
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: {
          comment: comment || existing.comment,
          score: score !== undefined ? Number(score) : existing.score,
        },
        include: { reviewer: true },
      });
    } else {
      review = await prisma.review.create({
        data: {
          applicationId: params.id,
          reviewerId: user.id,
          comment: comment || (score >= 4 ? "Approved candidate." : "Disapproved candidate."),
          score: score !== undefined ? Number(score) : null,
        },
        include: { reviewer: true },
      });
    }

    // Fetch all reviews for this application to calculate tally
    const allReviews = await prisma.review.findMany({
      where: { applicationId: params.id },
      include: { reviewer: true },
    });

    const approveVotes = allReviews.filter((r) => (r.score ?? 0) >= 4).length;
    const denyVotes = allReviews.filter((r) => (r.score ?? 0) <= 2 && r.score !== null).length;
    const threshold = application.position.guild.votePassThreshold || 2;
    const hasPassed = approveVotes >= threshold;

    return NextResponse.json({
      success: true,
      review,
      allReviews,
      approveVotes,
      denyVotes,
      votePassThreshold: threshold,
      hasPassed,
    });
  } catch (err) {
    console.error("Review creation error:", err);
    return NextResponse.json({ error: "Failed to record review or vote" }, { status: 500 });
  }
}
