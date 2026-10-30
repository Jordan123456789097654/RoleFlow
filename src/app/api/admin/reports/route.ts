import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  return me && isSiteAdminUser(me) ? me : null;
}

/** Open reports grouped by target, most distinct reporters first. */
export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const open = await prisma.contentReport.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" } });
  const grouped = new Map<string, { targetType: string; targetId: string; reporters: Set<string>; reasons: string[]; latest: Date }>();
  for (const r of open) {
    const key = `${r.targetType}:${r.targetId}`;
    const g = grouped.get(key) ?? { targetType: r.targetType, targetId: r.targetId, reporters: new Set(), reasons: [], latest: r.createdAt };
    g.reporters.add(r.reporterId);
    if (g.reasons.length < 5) g.reasons.push(r.reason);
    if (r.createdAt > g.latest) g.latest = r.createdAt;
    grouped.set(key, g);
  }

  const guildIds = Array.from(grouped.values()).filter((g) => g.targetType === "GUILD").map((g) => g.targetId);
  const guilds = await prisma.guild.findMany({ where: { id: { in: guildIds } }, select: { id: true, name: true, isPaused: true } });
  const guildMap = Object.fromEntries(guilds.map((g) => [g.id, g]));

  const rows = Array.from(grouped.values())
    .map((g) => ({
      targetType: g.targetType,
      targetId: g.targetId,
      targetName: g.targetType === "GUILD" ? guildMap[g.targetId]?.name ?? "(deleted)" : g.targetId,
      isPaused: g.targetType === "GUILD" ? guildMap[g.targetId]?.isPaused ?? false : null,
      distinctReporters: g.reporters.size,
      reasons: g.reasons,
      latestAt: g.latest,
    }))
    .sort((a, b) => b.distinctReporters - a.distinctReporters);
  return NextResponse.json(rows);
}

/**
 * Decide on every open report for one target.
 * APPROVE: the report was valid and action was taken (stored as ACTIONED).
 * DENY:    the report was not valid, no action taken (stored as DISMISSED). A note of 10+ characters is required.
 */
export async function POST(request: Request) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const targetType = String(body?.targetType ?? "");
  const targetId = String(body?.targetId ?? "");
  const rawDecision = String(body?.decision ?? "");
  const decision = rawDecision === "ACTION" ? "APPROVE" : rawDecision === "DISMISS" ? "DENY" : rawDecision;
  const note = String(body?.note ?? "").trim().slice(0, 1000);

  if (!["GUILD", "POSITION"].includes(targetType) || !targetId) return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  if (decision !== "APPROVE" && decision !== "DENY") return NextResponse.json({ error: "Choose approve or deny." }, { status: 400 });
  if (decision === "DENY" && note.length < 10) {
    return NextResponse.json({ error: "Explain why the report is denied (at least 10 characters)." }, { status: 400 });
  }

  const result = await prisma.contentReport.updateMany({
    where: { targetType, targetId, status: "OPEN" },
    data: {
      status: decision === "APPROVE" ? "ACTIONED" : "DISMISSED",
      reviewedById: me.id,
      reviewedAt: new Date(),
      reviewNote: note || null,
    },
  });
  await recordAudit({ actorId: me.id, action: decision === "APPROVE" ? "REPORTS_APPROVED" : "REPORTS_DENIED", targetId, details: { targetType, count: result.count, note } });
  return NextResponse.json({ success: true, closed: result.count });
}
