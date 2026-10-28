import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if active support code is still valid
    const now = new Date();
    const isSupportCodeActive =
      user.supportCode && user.supportCodeExpiresAt && user.supportCodeExpiresAt > now;

    return NextResponse.json({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      robloxUsername: user.robloxUsername,
      robloxAvatar: user.robloxAvatar,
      isSiteAdmin: user.isSiteAdmin || user.id === "1046538179399929957",
      applicationsCount: user._count.applications,
      createdAt: user.createdAt,
      supportMode: {
        isActive: !!isSupportCodeActive,
        code: isSupportCodeActive ? user.supportCode : null,
        expiresAt: isSupportCodeActive ? user.supportCodeExpiresAt : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
