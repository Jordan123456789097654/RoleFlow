import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBotAuth } from "@/lib/bot-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authErr = checkBotAuth(request);
  if (authErr) return authErr;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { discordId, blockedBy, reason } = body || {};

  if (!discordId || !blockedBy) {
    return NextResponse.json({ error: "discordId and blockedBy are required" }, { status: 400 });
  }

  const block = await prisma.modmailBlock.upsert({
    where: { discordUserId: String(discordId) },
    update: {
      blockedBy: String(blockedBy),
      reason: reason ? String(reason) : null,
    },
    create: {
      discordUserId: String(discordId),
      blockedBy: String(blockedBy),
      reason: reason ? String(reason) : null,
    },
  });

  return NextResponse.json({ ok: true, blockId: block.id }, { status: 201 });
}
