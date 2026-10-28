import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isFounderUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** Founder-only read access to the audit log. */
export async function GET(request: Request) {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, siteRole: true } });
  if (!me || !isFounderUser(me)) return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });

  const action = new URL(request.url).searchParams.get("action")?.trim() || undefined;
  const logs = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const actorIds = Array.from(new Set(logs.map((l) => l.actorId)));
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, username: true } });
  const names = Object.fromEntries(actors.map((a) => [a.id, a.username]));

  return NextResponse.json(logs.map((l) => ({ ...l, actorName: names[l.actorId] ?? null })));
}
