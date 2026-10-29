import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

/**
 * Records that the current user read and acknowledged an announcement.
 * Stores the user ID and time only. IP addresses are not recorded.
 */
export async function POST(_req: Request, { params }: { params: { id: string; annId: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;

  const ann = await prisma.announcement.findFirst({
    where: { id: params.annId, guildId: params.id },
    select: { id: true },
  });
  if (!ann) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });

  // readSeconds is enforced by the client gate. The server can't see when a user started reading,
  // so it records the acknowledgment as given.

  await prisma.announcementAck.upsert({
    where: { announcementId_userId: { announcementId: ann.id, userId: access.userId } },
    update: {},
    create: { announcementId: ann.id, userId: access.userId },
  });
  return NextResponse.json({ ok: true });
}
