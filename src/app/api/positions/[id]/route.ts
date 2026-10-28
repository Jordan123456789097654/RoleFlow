import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const position = await prisma.position.findUnique({
      where: { id: params.id },
      include: {
        guild: {
          select: {
            id: true,
            name: true,
            icon: true,
            isVerified: true,
            enableRobloxAuth: true,
            cooldownDays: true,
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!position || !position.isOpen) {
      return NextResponse.json(
        { error: "Position not found or is closed" },
        { status: 404 }
      );
    }

    return NextResponse.json(position);
  } catch (err) {
    console.error("Error fetching position:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
