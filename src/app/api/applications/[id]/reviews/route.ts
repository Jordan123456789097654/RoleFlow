import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        applicationId: params.id,
        reviewerId: user.id,
        comment,
        score: score ? Number(score) : null,
      },
      include: {
        reviewer: true,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("Review creation error:", err);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
