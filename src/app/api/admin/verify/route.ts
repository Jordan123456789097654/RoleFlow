import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { guildId, isVerified, verifiedBadge } = await request.json();

    if (!guildId) {
      return NextResponse.json({ error: "Guild ID is required" }, { status: 400 });
    }

    const updated = await prisma.guild.update({
      where: { id: guildId },
      data: {
        isVerified: Boolean(isVerified),
        verifiedBadge: verifiedBadge || (isVerified ? "OFFICIAL" : null),
      },
    });

    return NextResponse.json({ success: true, guild: updated });
  } catch (err) {
    console.error("Verification update error:", err);
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
  }
}
