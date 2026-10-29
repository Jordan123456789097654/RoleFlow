import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

/** Hard-gate announcements the current user has not acknowledged yet. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;
  const pending = await prisma.announcement.findMany({
    where: { guildId: params.id, hardGate: true, acks: { none: { userId: access.userId } } },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, body: true, readSeconds: true },
  });
  return NextResponse.json({ pending });
}
