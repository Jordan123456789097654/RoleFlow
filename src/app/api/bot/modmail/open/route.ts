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

  const { discordId, username, staffThreadId } = body || {};

  if (!discordId || !staffThreadId) {
    return NextResponse.json({ error: "discordId and staffThreadId are required" }, { status: 400 });
  }

  // Check if user is blocked in ModmailBlock
  const block = await prisma.modmailBlock.findUnique({
    where: { discordUserId: String(discordId) },
  });

  if (block) {
    return NextResponse.json(
      { error: "User is blocked from using modmail", reason: block.reason },
      { status: 403 }
    );
  }

  // Create ModmailThread
  const thread = await prisma.modmailThread.create({
    data: {
      discordUserId: String(discordId),
      staffThreadId: String(staffThreadId),
      status: "OPEN",
    },
  });

  return NextResponse.json({ threadId: thread.id }, { status: 201 });
}
