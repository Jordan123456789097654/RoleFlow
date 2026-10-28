import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isSiteAdmin = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: Super-admin required." }, { status: 403 });
    }

    const { guildId, isVerified, verifiedBadge } = await request.json();

    if (!guildId) {
      return NextResponse.json({ error: "Guild ID required" }, { status: 400 });
    }

    const updated = await prisma.guild.update({
      where: { id: guildId },
      data: {
        isVerified: !!isVerified,
        verifiedBadge: isVerified ? verifiedBadge || "OFFICIAL" : null,
      },
    });

    return NextResponse.json({ success: true, guild: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update verification" }, { status: 500 });
  }
}
