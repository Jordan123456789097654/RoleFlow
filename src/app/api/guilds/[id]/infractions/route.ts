import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { INFRACTION_CATEGORIES, isHttpsUrl, strikeRecommendation, strikeWindowStart } from "@/lib/compliance";

export const dynamic = "force-dynamic";

/** Infractions for one staff member (?staffUserId=) with current strike points. Managers only. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const staffUserId = new URL(req.url).searchParams.get("staffUserId");
  if (!staffUserId) return NextResponse.json({ error: "staffUserId is required" }, { status: 400 });

  const now = new Date();
  const items = await prisma.staffInfraction.findMany({
    where: { guildId: params.id, staffUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, category: true, note: true, points: true, evidenceUrls: true, createdAt: true },
  });
  const activePoints = items
    .filter((i) => i.createdAt >= strikeWindowStart(now))
    .reduce((sum, i) => sum + i.points, 0);

  return NextResponse.json({
    infractions: items,
    activePoints,
    recommendation: strikeRecommendation(activePoints),
  });
}

/** Logs a conduct infraction. Evidence must be https links. Managers only. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const staffUserId = String(body?.staffUserId ?? "");
  const category = String(body?.category ?? "");
  const note = String(body?.note ?? "").trim();
  const points = Number(body?.points);
  const evidenceUrls: string[] = Array.isArray(body?.evidenceUrls)
    ? body.evidenceUrls.map((u: unknown) => String(u).trim()).filter(Boolean)
    : [];

  if (!(INFRACTION_CATEGORIES as readonly string[]).includes(category))
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  if (!note || note.length > 2000) return NextResponse.json({ error: "Note is required (max 2000 characters)." }, { status: 400 });
  if (!Number.isInteger(points) || points < 1 || points > 10) return NextResponse.json({ error: "Points must be 1-10." }, { status: 400 });
  if (evidenceUrls.length > 5 || evidenceUrls.some((u) => u.length > 500 || !isHttpsUrl(u)))
    return NextResponse.json({ error: "Up to 5 https evidence links, each under 500 characters." }, { status: 400 });

  const staff = await prisma.guildStaff.findUnique({
    where: { guildId_userId: { guildId: params.id, userId: staffUserId } },
    select: { userId: true },
  });
  if (!staff) return NextResponse.json({ error: "Not a staff member of this community" }, { status: 404 });

  await prisma.staffInfraction.create({
    data: { guildId: params.id, staffUserId, category, note, points, evidenceUrls, createdById: access.userId },
  });
  return NextResponse.json({ ok: true });
}
