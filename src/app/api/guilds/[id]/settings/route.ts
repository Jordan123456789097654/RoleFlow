import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
    });

    if (!guild) {
      return NextResponse.json({ error: "Guild not found." }, { status: 404 });
    }

    const isOwner = guild.ownerId === currentUser.id;
    const isSiteAdmin = currentUser.isSiteAdmin || currentUser.id === "1046538179399929957";

    if (!isOwner && !isSiteAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this community." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      vanitySlug,
      description,
      tags,
      icon,
      banner,
      requireInGuild,
      minAccountAgeDays,
      cooldownDays,
      enableRobloxAuth,
      enableBlindVoting,
      useCustomBot,
      customBotToken,
      logChannelId,
      staffPingRoleId,
      embedColor,
    } = body;

    // Check slug uniqueness if changed
    if (vanitySlug && vanitySlug !== guild.vanitySlug) {
      const cleanSlug = vanitySlug.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
      const existingSlug = await prisma.guild.findUnique({
        where: { vanitySlug: cleanSlug },
      });
      if (existingSlug && existingSlug.id !== params.id) {
        return NextResponse.json({ error: "That vanity URL slug is already taken." }, { status: 400 });
      }
    }

    const updated = await prisma.guild.update({
      where: { id: params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(vanitySlug !== undefined ? { vanitySlug: vanitySlug?.trim() || null } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(tags !== undefined ? { tags: tags?.trim() || null } : {}),
        ...(icon !== undefined ? { icon: icon?.trim() || null } : {}),
        ...(banner !== undefined ? { banner: banner?.trim() || null } : {}),
        ...(typeof requireInGuild === "boolean" ? { requireInGuild } : {}),
        ...(minAccountAgeDays !== undefined ? { minAccountAgeDays: Number(minAccountAgeDays) || 0 } : {}),
        ...(cooldownDays !== undefined ? { cooldownDays: Number(cooldownDays) } : {}),
        ...(typeof enableRobloxAuth === "boolean" ? { enableRobloxAuth } : {}),
        ...(typeof enableBlindVoting === "boolean" ? { enableBlindVoting } : {}),
        ...(typeof useCustomBot === "boolean" ? { useCustomBot } : {}),
        ...(customBotToken !== undefined ? { customBotToken: customBotToken?.trim() || null } : {}),
        ...(logChannelId !== undefined ? { logChannelId: logChannelId?.trim() || null } : {}),
        ...(staffPingRoleId !== undefined ? { staffPingRoleId: staffPingRoleId?.trim() || null } : {}),
        ...(embedColor ? { embedColor: embedColor.trim() } : {}),
      },
    });

    return NextResponse.json({ success: true, guild: updated });
  } catch (err: any) {
    console.error("Settings save error:", err);
    return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 });
  }
}
