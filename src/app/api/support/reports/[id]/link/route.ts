import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getSupportCaller } from "@/lib/staff-access";
import { logReportEvent } from "@/lib/report-webhook";

export const dynamic = "force-dynamic";

/**
 * Link this report to an earlier one (or clear the link with parentId null).
 * Only the author or an administrator can change a report's link. Loops are refused.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parentId = body?.parentId ? String(body.parentId) : null;

  const report = await prisma.supportReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  if (report.authorId !== caller.id && !caller.isAdmin) {
    return NextResponse.json({ error: "You can only change the links on reports you filed." }, { status: 403 });
  }

  if (parentId) {
    if (parentId === report.id) return NextResponse.json({ error: "A report cannot be linked to itself." }, { status: 400 });
    let cursor = await prisma.supportReport.findUnique({ where: { id: parentId } });
    if (!cursor) return NextResponse.json({ error: "The report to link to was not found." }, { status: 404 });
    // Walk up the chain of parents. If we reach this report, the link would form a loop.
    for (let depth = 0; depth < 50 && cursor; depth++) {
      if (cursor.id === report.id) return NextResponse.json({ error: "That link would create a loop." }, { status: 400 });
      cursor = cursor.parentReportId ? await prisma.supportReport.findUnique({ where: { id: cursor.parentReportId } }) : null;
    }
  }

  const updated = await prisma.supportReport.update({ where: { id: report.id }, data: { parentReportId: parentId } });
  await logReportEvent({
    reportId: report.id,
    actorId: caller.id,
    actorName: caller.username,
    action: parentId ? "LINKED" : "UNLINKED",
    details: { parentId },
  });
  await recordAudit({ actorId: caller.id, action: "SUPPORT_REPORT_LINKED", targetId: report.subjectUserId, details: { reportId: report.id, parentId } });
  return NextResponse.json({ success: true, report: updated });
}
