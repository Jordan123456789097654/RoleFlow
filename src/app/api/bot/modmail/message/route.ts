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

  const { threadId, from, content, direction } = body || {};

  if (!threadId || !content || !direction) {
    return NextResponse.json({ error: "threadId, content, and direction are required" }, { status: 400 });
  }

  const normalizedDirection = String(direction).toUpperCase();
  if (normalizedDirection !== "INBOUND" && normalizedDirection !== "OUTBOUND") {
    return NextResponse.json({ error: "direction must be INBOUND or OUTBOUND" }, { status: 400 });
  }

  const thread = await prisma.modmailThread.findUnique({
    where: { id: String(threadId) },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const message = await prisma.modmailMessage.create({
    data: {
      threadId: thread.id,
      authorId: String(from || "UNKNOWN"),
      content: String(content),
      direction: normalizedDirection,
    },
  });

  return NextResponse.json({ ok: true, messageId: message.id }, { status: 201 });
}
