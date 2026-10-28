import { decryptSecret } from "@/lib/crypto";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
    });

    if (!guild) {
      return NextResponse.json({ error: "Guild not found" }, { status: 404 });
    }

    const token = (decryptSecret(guild.customBotToken) || process.env.DISCORD_BOT_TOKEN || "").trim();
    if (!token) {
      return NextResponse.json({ error: "No bot token configured" }, { status: 400 });
    }

    if (!guild.logChannelId) {
      return NextResponse.json({ error: "No alert channel ID set" }, { status: 400 });
    }

    let colorInt = 0x8b5cf6;
    if (guild.embedColor) {
      try {
        colorInt = parseInt(guild.embedColor.replace("#", ""), 16);
      } catch (e) {}
    }

    const embed = {
      title: "RoleFlow Test Alert",
      description: `Test embed dispatched successfully from **${guild.name}** dashboard!\n\nBot hosting and embed dispatching are online and functioning.`,
      color: colorInt,
      fields: [
        { name: "Channel Verified", value: `<#${guild.logChannelId}>`, inline: true },
        { name: "Staff Ping Role", value: guild.staffPingRoleId ? `<@&${guild.staffPingRoleId}>` : "*(None configured)*", inline: true },
      ],
      footer: { text: "RoleFlow Automation • roleflow.site" },
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(`https://discord.com/api/v10/channels/${guild.logChannelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: guild.staffPingRoleId ? `<@&${guild.staffPingRoleId}>` : undefined,
        embeds: [embed],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Discord rejected embed: ${errText}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Test embed dispatched to Discord!" });
  } catch (err: any) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
