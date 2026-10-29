import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { recordAudit } from "@/lib/audit";
import { validateSitePatch } from "@/lib/site-config";
import { loadSite } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const site = await loadSite(params.id);
  if (!site) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  return NextResponse.json(site, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const checked = validateSitePatch(body as Record<string, unknown>);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  if (Object.keys(checked.data).length === 0) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  await prisma.guild.update({
    where: { id: params.id },
    data: checked.data as any,
  });
  await recordAudit({
    actorId: access.userId,
    action: "SITE_CONFIG_UPDATED",
    targetId: params.id,
    details: { fields: Object.keys(checked.data) },
  });

  const site = await loadSite(params.id);
  return NextResponse.json({ ok: true, site });
}

