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
    const userId = cookieStore.get("roleflow_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { botToken } = await request.json();
    if (!botToken || !botToken.trim()) {
      return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
    }

    const cleanToken = botToken.trim();

    // Verify token with Discord API
    const userRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${cleanToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { valid: false, error: "Invalid bot token or unauthorized by Discord." },
        { status: 400 }
      );
    }

    const botUser = await userRes.json();

    // Check if bot is present in this guild
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${params.id}`, {
      headers: { Authorization: `Bot ${cleanToken}` },
    });

    const inGuild = guildRes.ok;

    return NextResponse.json({
      valid: true,
      inGuild,
      bot: {
        id: botUser.id,
        username: botUser.username,
        discriminator: botUser.discriminator,
        avatar: botUser.avatar
          ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`
          : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
