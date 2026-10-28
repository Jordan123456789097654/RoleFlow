import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
