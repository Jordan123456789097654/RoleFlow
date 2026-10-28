import { isFounderId } from "@/lib/roles";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
            banner: true,
            isVerified: true,
            verifiedBadge: true,
            verifiedBadges: true,
            enableRobloxAuth: true,
            enableRobloxGroupCheck: true,
            robloxGroupId: true,
            robloxMinRank: true,
            cooldownDays: true,
            isPaused: true,
            portalTheme: true,
            portalAccentColor: true,
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    return NextResponse.json(position);
  } catch (err: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const position = await prisma.position.findUnique({
      where: { id: params.id },
      include: { guild: true },
    });

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const isOwner = position.guild.ownerId === userId;
    const isSiteAdmin = isFounderId(userId);

    if (!isOwner && !isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not own this community." }, { status: 403 });
    }

    const body = await request.json();
    const { isOpen, isPublic, title, department, description, acceptRoleId } = body;

    const updated = await prisma.position.update({
      where: { id: params.id },
      data: {
        ...(typeof isOpen === "boolean" ? { isOpen } : {}),
        ...(typeof isPublic === "boolean" ? { isPublic } : {}),
        ...(title ? { title: title.trim() } : {}),
        ...(department !== undefined ? { department } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(acceptRoleId !== undefined ? { acceptRoleId: acceptRoleId?.trim() || null } : {}),
      },
    });

    return NextResponse.json({ success: true, position: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const position = await prisma.position.findUnique({
      where: { id: params.id },
      include: { guild: true },
    });

    if (!position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const isOwner = position.guild.ownerId === userId;
    const isSiteAdmin = isFounderId(userId);

    if (!isOwner && !isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not own this community." }, { status: 403 });
    }

    await prisma.position.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Position deleted." });
  } catch (err: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
