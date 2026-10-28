import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const callerId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({ where: { id: callerId } });
    const isStaff = caller?.isSupportStaff || caller?.isSiteAdmin || caller?.id === "1046538179399929957";

    if (!isStaff) {
      return NextResponse.json({ error: "Forbidden: Support Staff role required" }, { status: 403 });
    }

    const now = new Date();

    // Fetch members with active, non-expired support codes
    const activeUsers = await prisma.user.findMany({
      where: {
        supportCode: { not: null },
        supportCodeExpiresAt: { gt: now },
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        supportCode: true,
        supportCodeExpiresAt: true,
        createdAt: true,
      },
      orderBy: { supportCodeExpiresAt: "desc" },
    });

    const formatted = activeUsers.map((u) => {
      const remainingMs = u.supportCodeExpiresAt ? u.supportCodeExpiresAt.getTime() - now.getTime() : 0;
      return {
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        supportCode: u.supportCode,
        expiresInMinutes: Math.max(1, Math.ceil(remainingMs / (60 * 1000))),
      };
    });

    return NextResponse.json({ activeSessions: formatted });
  } catch (err) {
    console.error("Support active sessions error:", err);
    return NextResponse.json({ error: "Failed to fetch active sessions" }, { status: 500 });
  }
}
