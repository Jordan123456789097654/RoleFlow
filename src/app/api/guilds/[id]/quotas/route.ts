import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;
  const rules = await prisma.quotaRule.findMany({
    where: { guildId: params.id },
    orderBy: { robloxRankId: "asc" },
    select: { robloxRankId: true, rankName: true, weeklyMinutes: true },
  });
  return NextResponse.json({ rules });
}

/** Replaces all rank quotas for the community. Owner or site admin only. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const input = Array.isArray(body?.rules) ? body.rules : null;
  if (!input) return NextResponse.json({ error: "rules must be an array" }, { status: 400 });
  if (input.length > 255) return NextResponse.json({ error: "Too many rules" }, { status: 400 });

  const rules: { guildId: string; robloxRankId: number; rankName: string; weeklyMinutes: number }[] = [];
  const seen = new Set<number>();
  for (const r of input) {
    const rankId = Number(r?.robloxRankId);
    const weeklyMinutes = Number(r?.weeklyMinutes);
    const rankName = String(r?.rankName ?? "").trim().slice(0, 80);
    if (!Number.isInteger(rankId) || rankId < 0 || rankId > 255)
      return NextResponse.json({ error: "robloxRankId must be 0-255" }, { status: 400 });
    if (!Number.isInteger(weeklyMinutes) || weeklyMinutes < 0 || weeklyMinutes > 10_080)
      return NextResponse.json({ error: "weeklyMinutes must be 0-10080" }, { status: 400 });
    if (seen.has(rankId)) return NextResponse.json({ error: `Duplicate rank ${rankId}` }, { status: 400 });
    seen.add(rankId);
    rules.push({ guildId: params.id, robloxRankId: rankId, rankName: rankName || `Rank ${rankId}`, weeklyMinutes });
  }

  await prisma.$transaction([
    prisma.quotaRule.deleteMany({ where: { guildId: params.id } }),
    prisma.quotaRule.createMany({ data: rules }),
  ]);
  return NextResponse.json({ ok: true, count: rules.length });
}
