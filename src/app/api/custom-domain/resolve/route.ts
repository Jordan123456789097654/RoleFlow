import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guildForCustomDomain, normalizeDomain } from "@/lib/custom-domain";

export const dynamic = "force-dynamic";

/**
 * Used by middleware. Tells it whether a host is a verified community domain, which community it belongs to,
 * and (optionally) whether a position belongs to that community.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const domain = normalizeDomain(params.get("host") || "");
  const guild = domain ? await guildForCustomDomain(domain) : null;
  const headers = { "Cache-Control": "no-store" };
  if (!guild) return NextResponse.json({ verified: false }, { headers });

  let positionOk: boolean | undefined;
  const position = params.get("position");
  if (position && /^[A-Za-z0-9_-]{1,100}$/.test(position)) {
    const p = await prisma.position.findUnique({ where: { id: position }, select: { guildId: true } });
    positionOk = p?.guildId === guild.id;
  }

  return NextResponse.json(
    { verified: true, guildId: guild.id, slug: guild.vanitySlug || guild.id, positionOk },
    { headers }
  );
}
