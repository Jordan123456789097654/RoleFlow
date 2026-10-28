import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Site Admins see all guilds; normal users see guilds they own
    const guilds = await prisma.guild.findMany({
      where: user.isSiteAdmin ? {} : { ownerId: userId },
      include: {
        _count: {
          select: {
            positions: true,
          },
        },
        positions: {
          select: {
            id: true,
            title: true,
            isOpen: true,
            _count: {
              select: { applications: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        isSiteAdmin: user.isSiteAdmin,
      },
      guilds,
    });
  } catch (err: any) {
    console.error("Fetch user guilds error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
