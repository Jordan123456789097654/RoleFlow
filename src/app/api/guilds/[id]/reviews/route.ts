import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { escapeHtml } from "@/lib/sanitize";

// GET /api/guilds/[id]/reviews
// Returns approved/recent reviews for the community with average rating and stats.
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guildId = params.id;

    // Find guild by id or vanity slug
    const guild = await prisma.guild.findFirst({
      where: {
        OR: [{ id: guildId }, { vanitySlug: guildId }],
      },
      select: { id: true, name: true },
    });

    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const reviews = await prisma.communityReview.findMany({
      where: { guildId: guild.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            robloxUsername: true,
            robloxAvatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    // Distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      if (ratingDistribution[r.rating] !== undefined) {
        ratingDistribution[r.rating]++;
      }
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
    });
  } catch (err) {
    console.error("Failed to fetch community reviews:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/guilds/[id]/reviews
// Allow applicants whose application was ACCEPTED in this guild to post/update a 1-5 star review.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const guildId = params.id;

    // Find guild by id or vanity slug
    const guild = await prisma.guild.findFirst({
      where: {
        OR: [{ id: guildId }, { vanitySlug: guildId }],
      },
      select: { id: true, name: true },
    });

    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Verify applicant has an ACCEPTED application for this guild
    const acceptedApp = await prisma.application.findFirst({
      where: {
        userId: currentUser.id,
        status: "ACCEPTED",
        position: {
          guildId: guild.id,
        },
      },
      select: { id: true, position: { select: { title: true } } },
    });

    if (!acceptedApp) {
      return NextResponse.json(
        {
          error:
            "Only members who have had an application accepted in this community may post a review/testimonial.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rating = Number(body.rating);
    const rawComment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5." },
        { status: 400 }
      );
    }

    if (!rawComment || rawComment.length < 3) {
      return NextResponse.json(
        { error: "Comment must be at least 3 characters long." },
        { status: 400 }
      );
    }

    if (rawComment.length > 500) {
      return NextResponse.json(
        { error: "Comment cannot exceed 500 characters." },
        { status: 400 }
      );
    }

    const comment = escapeHtml(rawComment);

    // Upsert community review
    const review = await prisma.communityReview.upsert({
      where: {
        guildId_userId: {
          guildId: guild.id,
          userId: currentUser.id,
        },
      },
      create: {
        guildId: guild.id,
        userId: currentUser.id,
        rating,
        comment,
      },
      update: {
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            robloxUsername: true,
            robloxAvatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      review,
      message: "Your review has been published!",
    });
  } catch (err) {
    console.error("Failed to submit review:", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
