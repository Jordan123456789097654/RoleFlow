import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
