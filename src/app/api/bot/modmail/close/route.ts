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

  const { threadId, closedBy } = body || {};

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  const thread = await prisma.modmailThread.findUnique({
    where: { id: String(threadId) },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.status === "CLOSED") {
    return NextResponse.json({ error: "Thread is already closed" }, { status: 400 });
  }

  const closedAt = new Date();
  const durationMs = closedAt.getTime() - new Date(thread.createdAt).getTime();
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

  await prisma.modmailThread.update({
    where: { id: thread.id },
    data: {
      status: "CLOSED",
      closedAt,
      closedBy: closedBy ? String(closedBy) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    durationMinutes,
    messageCount: thread._count.messages,
  });
}
