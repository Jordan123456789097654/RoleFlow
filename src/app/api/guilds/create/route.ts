import { communityLimit } from "@/lib/licensing";
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
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, vanitySlug, description, tags } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Community Name is required." }, { status: 400 });
    }

    // Clean inputs - ID is optional; generate a clean unique community ID if not provided
    const cleanId = id && id.trim()
      ? id.trim()
      : `c_${Math.random().toString(36).substring(2, 8)}${Date.now().toString(36)}`;
    const cleanName = name.trim();
    const slug = (vanitySlug || cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")).replace(/^-+|-+$/g, "");

    // Check if guild already exists
    const existing = await prisma.guild.findUnique({
      where: { id: cleanId },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create Guild
    const ownedCount = await prisma.guild.count({ where: { ownerId: userId } });
    if (ownedCount >= (await communityLimit(userId))) {
      return NextResponse.json({ error: "Your plan allows a limited number of communities. Redeem a license key in Settings to add more." }, { status: 402 });
    }
    const newGuild = await prisma.guild.create({
      data: {
        id: cleanId,
        name: cleanName,
        vanitySlug: slug,
        ownerId: userId,
        description: description || `Welcome to ${cleanName}! We are actively recruiting staff and developers.`,
        tags: tags || "Community,Staff,Recruitment",
        banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        cooldownDays: 7,
        requireInGuild: false,
        enableRobloxAuth: true,
        enableBlindVoting: false,
        useCustomBot: false,
      },
    });

    return NextResponse.json(newGuild);
  } catch (err: any) {
    console.error("Failed to create guild:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
