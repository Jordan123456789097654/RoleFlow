import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isSiteAdmin = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: Site Super-Admin required." }, { status: 403 });
    }

    const guilds = await prisma.guild.findMany({
      include: {
        _count: {
          select: {
            positions: true,
          },
        },
        positions: {
          select: {
            _count: {
              select: { applications: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = guilds.map((g) => {
      const totalApps = g.positions.reduce((acc, pos) => acc + pos._count.applications, 0);
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        vanitySlug: g.vanitySlug,
        isVerified: g.isVerified,
        verifiedBadge: g.verifiedBadge,
        isPaused: g.isPaused,
        memberCount: g.memberCount,
        tags: g.tags,
        positionsCount: g._count.positions,
        applicationsCount: totalApps,
      };
    });

    return NextResponse.json(mapped);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch guilds" }, { status: 500 });
  }
}

// Founder: Pause / Unpause Community
export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isSiteAdmin = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { guildId, isPaused } = await request.json();

    if (!guildId) {
      return NextResponse.json({ error: "guildId is required" }, { status: 400 });
    }

    const updated = await prisma.guild.update({
      where: { id: guildId },
      data: { isPaused: Boolean(isPaused) },
    });

    return NextResponse.json({ success: true, guild: updated });
  } catch (err) {
    console.error("Guild pause toggle error:", err);
    return NextResponse.json({ error: "Failed to update community status" }, { status: 500 });
  }
}

// Founder: Permanently Delete Community
export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isSiteAdmin = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get("guildId");

    if (!guildId) {
      return NextResponse.json({ error: "guildId is required" }, { status: 400 });
    }

    await prisma.guild.delete({
      where: { id: guildId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Guild delete error:", err);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
