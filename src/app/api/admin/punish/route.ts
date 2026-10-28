import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";
import { punishUser, liftUserPunishments, applyGuildAction } from "@/lib/punishments";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  if (!me || !isSiteAdminUser(me)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { userId };
}

/** Issue or lift a punishment on a user or a community. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { targetType, targetId, action, reason, days, lift } = body;
  if (!targetId || !reason?.trim()) {
    return NextResponse.json({ error: "A target and a reason are required." }, { status: 400 });
  }

  if (targetType === "USER") {
    if (lift) {
      const count = await liftUserPunishments(targetId, auth.userId);
      return NextResponse.json({ success: true, lifted: count });
    }
    if (!["WARNING", "SUSPENSION", "BAN"].includes(action)) {
      return NextResponse.json({ error: "Invalid user action." }, { status: 400 });
    }
    const punishment = await punishUser({
      userId: targetId,
      action,
      reason: reason.trim(),
      days: days ? Number(days) : null,
      issuedById: auth.userId,
    });
    return NextResponse.json({ success: true, punishment });
  }

  if (targetType === "GUILD") {
    const guildAction = lift ? "UNPAUSE" : action;
    if (!["PAUSE", "UNPAUSE", "BLACKLIST"].includes(guildAction)) {
      return NextResponse.json({ error: "Invalid community action." }, { status: 400 });
    }
    const guild = await applyGuildAction({ guildId: targetId, action: guildAction, reason: reason.trim(), issuedById: auth.userId });
    if (!guild) return NextResponse.json({ error: "Community not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "targetType must be USER or GUILD" }, { status: 400 });
}

/** Punishment history for one target. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("targetId");
  const rows = await prisma.punishment.findMany({
    where: targetId ? { targetId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(rows);
}
