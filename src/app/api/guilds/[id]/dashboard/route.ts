import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
      include: {
        positions: {
          include: {
            questions: { orderBy: { order: "asc" } },
            _count: { select: { applications: true } },
          },
        },
        blacklists: true,
      },
    });

    if (!guild) {
      return NextResponse.json({ error: "Guild not found" }, { status: 404 });
    }

    // STRICT PERMISSION CHECK: Must be the community owner or a designated site super-admin
    const isOwner = guild.ownerId === currentUser.id;
    const isSiteAdmin = currentUser.isSiteAdmin || currentUser.id === "1046538179399929957";

    if (!isOwner && !isSiteAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not own or manage this community." },
        { status: 403 }
      );
    }

    // Fetch applications for all positions in this guild
    const applications = await prisma.application.findMany({
      where: {
        position: { guildId: params.id },
      },
      include: {
        user: true,
        position: true,
        answers: {
          include: { question: true },
        },
        reviews: {
          include: { reviewer: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ...guild,
      applications,
      isOwner,
      isSiteAdmin,
    });
  } catch (err: any) {
    console.error("Dashboard fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
