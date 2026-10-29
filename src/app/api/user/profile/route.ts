import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_ENTRIES = 40;
const MAX_VALUE = 2000;

function readAnswers(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.answers === "object" && !Array.isArray(parsed.answers) ? parsed.answers : {};
  } catch {
    return {};
  }
}

/** Answers the user opted to remember, keyed by normalized question label. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { savedProfile: true } });
  return NextResponse.json({ answers: readAnswers(row?.savedProfile ?? null) });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const incoming = body?.answers;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return NextResponse.json({ error: "answers must be an object" }, { status: 400 });
  }

  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { savedProfile: true } });
  const merged: Record<string, string> = { ...readAnswers(row?.savedProfile ?? null) };
  for (const [k, v] of Object.entries(incoming)) {
    if (typeof v !== "string" || !k.trim()) continue;
    merged[k.slice(0, 200)] = v.slice(0, MAX_VALUE);
  }
  const entries = Object.entries(merged).slice(-MAX_ENTRIES);
  await prisma.user.update({ where: { id: user.id }, data: { savedProfile: JSON.stringify({ answers: Object.fromEntries(entries) }) } });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({ where: { id: user.id }, data: { savedProfile: null } });
  return NextResponse.json({ success: true });
}
