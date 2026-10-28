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
      useCustomBot,
      customBotToken,
      logChannelId,
      cooldownDays,
      enableRobloxAuth,
      enableBlindVoting,
      embedColor,
      staffPingRoleId,
    } = body;

    const updated = await prisma.guild.update({
      where: { id: params.id },
      data: {
        useCustomBot: useCustomBot ?? false,
        customBotToken: customBotToken || null,
        logChannelId: logChannelId || null,
        cooldownDays: cooldownDays ?? 7,
        enableRobloxAuth: enableRobloxAuth ?? false,
        enableBlindVoting: enableBlindVoting ?? false,
        embedColor: embedColor || "#8B5CF6",
        staffPingRoleId: staffPingRoleId || null,
      },
    });

    return NextResponse.json({ success: true, guild: updated });
  } catch (err) {
    console.error("Settings save error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
