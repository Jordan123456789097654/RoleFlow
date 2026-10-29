import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

const MIN_MESSAGE = 80;
const MAX_MESSAGE = 2000;

/** Latest partnership application for this community, plus whether the community is already a partner. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const [latest, guild] = await Promise.all([
    prisma.partnershipApplication.findFirst({ where: { guildId: params.id }, orderBy: { createdAt: "desc" } }),
    prisma.guild.findUnique({ where: { id: params.id }, select: { verifiedBadges: true } }),
  ]);
  return NextResponse.json({
    isPartner: (guild?.verifiedBadges || "").split(",").includes("PARTNER"),
    application: latest
      ? {
          id: latest.id,
          status: latest.status,
          message: latest.message,
          website: latest.website,
          reviewNote: latest.reviewNote,
          createdAt: latest.createdAt,
          reviewedAt: latest.reviewedAt,
        }
      : null,
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => ({}));
  const message = String(body.message || "").trim();
  const website = String(body.website || "").trim();

  if (message.length < MIN_MESSAGE || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Tell us about your community in ${MIN_MESSAGE}-${MAX_MESSAGE} characters.` },
      { status: 400 }
    );
  }
  if (website && !/^https:\/\/[^\s]+$/.test(website)) {
    return NextResponse.json({ error: "Your website must be a full https:// link." }, { status: 400 });
  }

  const guild = await prisma.guild.findUnique({ where: { id: params.id }, select: { verifiedBadges: true } });
  if ((guild?.verifiedBadges || "").split(",").includes("PARTNER")) {
    return NextResponse.json({ error: "This community is already a partner." }, { status: 409 });
  }

  const pending = await prisma.partnershipApplication.findFirst({
    where: { guildId: params.id, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    return NextResponse.json({ error: "You already have a partnership application under review." }, { status: 409 });
  }

  await prisma.partnershipApplication.create({
    data: { guildId: params.id, applicantId: access.userId, message, website: website || null },
  });
  return NextResponse.json({ ok: true, message: "Application submitted. The RoleFlow founder reviews every partnership." });
}
