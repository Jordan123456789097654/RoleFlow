import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
const MAX_BYTES = 60_000;

export async function GET(_req: Request, { params }: { params: { positionId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await prisma.applicationDraft.findUnique({
    where: { userId_positionId: { userId: user.id, positionId: params.positionId } },
  });
  if (!row) return NextResponse.json({ draft: null });
  try {
    return NextResponse.json({ draft: { ...JSON.parse(row.data), savedAt: row.updatedAt } });
  } catch {
    return NextResponse.json({ draft: null });
  }
}

export async function PUT(request: Request, { params }: { params: { positionId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const answers = body?.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object" }, { status: 400 });
  }
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v === "string") clean[k] = v.slice(0, 4000);
  }
  const roblox = typeof body.robloxUsername === "string" ? body.robloxUsername.slice(0, 20) : "";
  const data = JSON.stringify({ answers: clean, robloxUsername: roblox });
  if (data.length > MAX_BYTES) return NextResponse.json({ error: "Draft too large" }, { status: 413 });

  const position = await prisma.position.findUnique({ where: { id: params.positionId }, select: { id: true } });
  if (!position) return NextResponse.json({ error: "Opening not found" }, { status: 404 });

  await prisma.applicationDraft.upsert({
    where: { userId_positionId: { userId: user.id, positionId: params.positionId } },
    update: { data },
    create: { userId: user.id, positionId: params.positionId, data },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: { positionId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.applicationDraft.deleteMany({ where: { userId: user.id, positionId: params.positionId } });
  return NextResponse.json({ success: true });
}
