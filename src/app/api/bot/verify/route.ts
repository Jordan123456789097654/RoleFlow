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

  const { discordId } = body || {};
  if (!discordId) {
    return NextResponse.json({ error: "discordId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: String(discordId) },
    select: {
      id: true,
      username: true,
      robloxId: true,
      robloxUsername: true,
    },
  });

  if (user && user.robloxId) {
    return NextResponse.json({
      linked: true,
      user: {
        id: user.id,
        username: user.username,
        robloxId: user.robloxId,
        robloxUsername: user.robloxUsername,
      },
    });
  }

  return NextResponse.json({ linked: false });
}
