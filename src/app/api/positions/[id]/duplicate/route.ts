import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { isGuildPaid, LIMITS } from "@/lib/licensing";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Copies an opening with its questions and schedule. The copy is open now, like a new opening. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const source = await prisma.position.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!source) return NextResponse.json({ error: "Position not found" }, { status: 404 });

  const access = await authorizeGuild(source.guildId, "manage");
  if (!access.ok) return access.response;

  if (!(await isGuildPaid(source.guildId))) {
    const openNow = await prisma.position.count({ where: { guildId: source.guildId, isOpen: true } });
    if (openNow >= LIMITS.freeOpenPositions) {
      return NextResponse.json(
        { error: `Free communities can keep ${LIMITS.freeOpenPositions} open positions. Close one or redeem a license key.` },
        { status: 402 }
      );
    }
  }

  const copy = await prisma.position.create({
    data: {
      guildId: source.guildId,
      title: `${source.title} (copy)`,
      department: source.department,
      description: source.description,
      isPublic: source.isPublic,
      acceptRoleId: source.acceptRoleId,
      isOpen: true,
      opensAt: source.opensAt,
      closesAt: source.closesAt,
      maxApplications: source.maxApplications,
      waitlistEnabled: source.waitlistEnabled,
      timeLimitMinutes: source.timeLimitMinutes,
      richMediaLinks: source.richMediaLinks,
      questions: {
        create: source.questions.map(({ id, positionId, ...q }) => q),
      },
    },
  });

  await recordAudit({
    actorId: access.userId,
    action: "POSITION_DUPLICATE",
    targetId: copy.id,
    details: { from: source.id, title: copy.title },
  });

  return NextResponse.json({ success: true, position: copy });
}
