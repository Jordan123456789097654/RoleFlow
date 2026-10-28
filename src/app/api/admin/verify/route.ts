import { isFounderId } from "@/lib/roles";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isSiteAdmin = currentUser?.isSiteAdmin || isFounderId(currentUser?.id);

    if (!isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: Super-admin required." }, { status: 403 });
    }

    const body = await request.json();
    const { guildId, isVerified, verifiedBadge, verifiedBadges } = body;

    if (!guildId) {
      return NextResponse.json({ error: "Guild ID required" }, { status: 400 });
    }

    let badgesString = null;
    if (Array.isArray(verifiedBadges)) {
      badgesString = verifiedBadges.filter(Boolean).join(",");
    } else if (typeof verifiedBadges === "string") {
      badgesString = verifiedBadges;
    } else if (verifiedBadge) {
      badgesString = verifiedBadge;
    }

    const hasBadges = Boolean(badgesString && badgesString.length > 0) || Boolean(isVerified);

    const updated = await prisma.guild.update({
      where: { id: guildId },
      data: {
        isVerified: hasBadges,
        verifiedBadge: badgesString ? badgesString.split(",")[0] : null,
        verifiedBadges: badgesString,
      },
    });

    return NextResponse.json({ success: true, guild: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
  }
}
