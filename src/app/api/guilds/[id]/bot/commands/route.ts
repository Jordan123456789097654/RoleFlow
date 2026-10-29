import { decryptSecret } from "@/lib/crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { registerCommands } from "@/lib/discord-commands";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Registers RoleFlow's slash commands under the community's own bot with instant guild registration. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const guild = await prisma.guild.findUnique({
    where: { id: params.id },
    select: { useCustomBot: true, customBotAppId: true, customBotToken: true },
  });
  if (!guild?.useCustomBot || !guild.customBotAppId || !guild.customBotToken) {
    return NextResponse.json(
      { error: "Turn on your custom bot and save its application ID and token first." },
      { status: 400 }
    );
  }

  // Pass params.id (guildId) to register directly as guild commands for INSTANT 0-second registration!
  const result = await registerCommands(
    guild.customBotAppId, 
    decryptSecret(guild.customBotToken),
    params.id
  );

  if (!result.ok) {
    await recordAudit({ actorId: access.userId, action: "BOT_COMMANDS_FAILED", targetId: params.id, details: { status: result.status } });
    const hint = result.status === 401 || result.status === 403
      ? "Discord rejected the bot token. Check that it is the token for the application ID you entered."
      : `Discord returned ${result.status}. ${result.detail}`;
    return NextResponse.json({ error: hint }, { status: 502 });
  }

  await recordAudit({ actorId: access.userId, action: "BOT_COMMANDS_REGISTERED", targetId: params.id, details: { count: result.count } });
  return NextResponse.json({ success: true, count: result.count });
}
