import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { founderUserId, withPartnerBadge } from "@/lib/partnership";

export const dynamic = "force-dynamic";

/** Founder only: approve or reject a partnership application. Approval adds the Partner badge. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const founder = await founderUserId();
  if (!founder) return NextResponse.json({ error: "Founder access required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const decision = body.decision;
  const note = body.note ? String(body.note).trim().slice(0, 1000) : null;
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return NextResponse.json({ error: "Decision must be APPROVED or REJECTED." }, { status: 400 });
  }

  const app = await prisma.partnershipApplication.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, guildId: true },
  });
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (app.status !== "PENDING") {
    return NextResponse.json({ error: "This application has already been decided." }, { status: 409 });
  }

  const reviewedAt = new Date();
  if (decision === "APPROVED") {
    const guild = await prisma.guild.findUnique({ where: { id: app.guildId }, select: { verifiedBadges: true } });
    const badges = withPartnerBadge(guild?.verifiedBadges);
    await prisma.$transaction([
      prisma.partnershipApplication.update({
        where: { id: app.id },
        data: { status: "APPROVED", reviewNote: note, reviewedById: founder, reviewedAt },
      }),
      prisma.guild.update({
        where: { id: app.guildId },
        data: { isVerified: true, verifiedBadges: badges.verifiedBadges, verifiedBadge: badges.verifiedBadge },
      }),
    ]);
  } else {
    await prisma.partnershipApplication.update({
      where: { id: app.id },
      data: { status: "REJECTED", reviewNote: note, reviewedById: founder, reviewedAt },
    });
  }
  return NextResponse.json({ ok: true });
}
