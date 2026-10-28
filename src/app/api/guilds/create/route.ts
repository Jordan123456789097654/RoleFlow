import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, vanitySlug, description, tags } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "Server ID and Name are required." }, { status: 400 });
    }

    // Clean inputs
    const cleanId = id.trim();
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
        enableRobloxAuth: true,
        enableBlindVoting: false,
        useCustomBot: false,
        positions: {
          create: [
            {
              title: "Community Moderator",
              department: "Moderation",
              description: "Maintain chat safety, handle member disputes, and moderate active voice & text channels.",
              isPublic: true,
              isOpen: true,
              questions: {
                create: [
                  {
                    order: 0,
                    label: "What is your Discord username and tag?",
                    type: "TEXT",
                    required: true,
                  },
                  {
                    order: 1,
                    label: "How many hours per week can you dedicate to moderation?",
                    type: "SELECT",
                    options: "5-10 hours,10-20 hours,20+ hours",
                    required: true,
                  },
                  {
                    order: 2,
                    label: "Describe a past conflict you successfully de-escalated.",
                    type: "LONG_TEXT",
                    required: true,
                  },
                ],
              },
            },
            {
              title: "Roblox Studio Developer",
              department: "Development",
              description: "Build immersive assets, write optimized Luau scripts, or design 3D models for our community experiences.",
              isPublic: true,
              isOpen: true,
              questions: {
                create: [
                  {
                    order: 0,
                    label: "Link your Roblox Profile or DevForum Portfolio",
                    type: "TEXT",
                    required: true,
                  },
                  {
                    order: 1,
                    label: "What is your primary development specialization?",
                    type: "SELECT",
                    options: "Luau Scripting,3D Modeling / Blender,UI/UX Design,Level Design / Building,Audio / VFX",
                    required: true,
                  },
                  {
                    order: 2,
                    label: "Describe your recent projects and modular framework experience.",
                    type: "LONG_TEXT",
                    required: true,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    return NextResponse.json(newGuild);
  } catch (err: any) {
    console.error("Failed to create guild:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
