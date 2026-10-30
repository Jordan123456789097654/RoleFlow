import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupportCaller } from "@/lib/staff-access";

export const dynamic = "force-dynamic";

/** Find accounts by Discord ID, username, email, or Roblox username. */
export async function GET(request: Request) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: q },
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { robloxUsername: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, username: true, avatar: true, robloxUsername: true, plan: true, isBanned: true, createdAt: true },
    take: 25,
  });
  return NextResponse.json({ users });
}
