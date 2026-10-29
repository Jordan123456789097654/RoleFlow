import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

const MAX_SAVED = 100;

async function currentUserId() {
  return verifySessionValue(cookies().get("roleflow_user_id")?.value);
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.savedPosition.findMany({
    where: { userId },
    select: { positionId: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ positionIds: rows.map((r) => r.positionId) });
}

/** Toggles a saved opening. Returns { saved: boolean }. */
export async function POST(request: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const positionId = typeof body?.positionId === "string" ? body.positionId : "";
    if (!positionId) return NextResponse.json({ error: "positionId is required" }, { status: 400 });

    const existing = await prisma.savedPosition.findUnique({
      where: { userId_positionId: { userId, positionId } },
    });
    if (existing) {
      await prisma.savedPosition.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    const position = await prisma.position.findUnique({ where: { id: positionId }, select: { id: true } });
    if (!position) return NextResponse.json({ error: "Opening not found" }, { status: 404 });

    const count = await prisma.savedPosition.count({ where: { userId } });
    if (count >= MAX_SAVED) {
      return NextResponse.json({ error: `You can save up to ${MAX_SAVED} openings.` }, { status: 400 });
    }

    await prisma.savedPosition.create({ data: { userId, positionId } });
    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("Saved position toggle error:", err);
    return NextResponse.json({ error: "Failed to update saved openings" }, { status: 500 });
  }
}
