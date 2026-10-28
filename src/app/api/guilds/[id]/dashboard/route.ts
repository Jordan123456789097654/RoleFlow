import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
