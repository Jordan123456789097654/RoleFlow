import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

/** Lists recent announcements with acknowledgment counts. Managers only. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const items = await prisma.announcement.findMany({
    where: { guildId: params.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, hardGate: true, readSeconds: true, createdAt: true, _count: { select: { acks: true } } },
  });
  return NextResponse.json({ announcements: items });
}

/** Creates an announcement. Edits are made by posting a new one, so acknowledgments always match the text read. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const text = String(body?.body ?? "").trim();
  const hardGate = body?.hardGate === true;
  const readSeconds = Number(body?.readSeconds ?? 0);

  if (!title || title.length > 120) return NextResponse.json({ error: "Title is required (max 120 characters)." }, { status: 400 });
  if (!text || text.length > 4000) return NextResponse.json({ error: "Body is required (max 4000 characters)." }, { status: 400 });
  if (!Number.isInteger(readSeconds) || readSeconds < 0 || readSeconds > 120)
    return NextResponse.json({ error: "readSeconds must be 0-120." }, { status: 400 });

  const created = await prisma.announcement.create({
    data: { guildId: params.id, title, body: text, hardGate, readSeconds, createdById: access.userId },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
