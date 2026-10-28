import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { id: { contains: query } },
              { robloxUsername: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
        robloxUsername: true,
        isSiteAdmin: true,
        isSupportStaff: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: [
        { isSiteAdmin: "desc" },
        { isSupportStaff: "desc" },
        { createdAt: "desc" },
      ],
      take: 50,
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, isSupportStaff, isSiteAdmin } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(typeof isSupportStaff === "boolean" ? { isSupportStaff } : {}),
        ...(typeof isSiteAdmin === "boolean" ? { isSiteAdmin } : {}),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Admin user role update error:", err);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}
