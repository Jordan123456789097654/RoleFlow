import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

/** Any signed-in user can report a community or position. One report per person per target. */
export async function POST(request: Request) {
  if (!(await isFeatureEnabled("community_reports"))) {
    return NextResponse.json({ error: "Reporting is currently unavailable." }, { status: 404 });
  }
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Sign in to report a community." }, { status: 401 });

  const { targetType, targetId, reason } = await request.json();
  if (!["GUILD", "POSITION"].includes(targetType) || !targetId) {
    return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  }
  if (!reason?.trim() || String(reason).length > 500) {
    return NextResponse.json({ error: "Please describe the problem (up to 500 characters)." }, { status: 400 });
  }

  const exists = targetType === "GUILD"
    ? await prisma.guild.findUnique({ where: { id: String(targetId) }, select: { id: true } })
    : await prisma.position.findUnique({ where: { id: String(targetId) }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.contentReport.upsert({
    where: { targetType_targetId_reporterId: { targetType, targetId: String(targetId), reporterId: userId } },
    update: { reason: String(reason).trim(), status: "OPEN" },
    create: { targetType, targetId: String(targetId), reporterId: userId, reason: String(reason).trim() },
  });
  return NextResponse.json({ success: true });
}
