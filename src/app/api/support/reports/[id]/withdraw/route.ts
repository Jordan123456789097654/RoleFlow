import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getSupportCaller } from "@/lib/staff-access";
import { getTemplate, canUseTemplate } from "@/lib/support-reports";
import { logReportEvent } from "@/lib/report-webhook";

export const dynamic = "force-dynamic";

/**
 * Moves a report out of pending review without a verdict. Allowed for the person who filed it
 * (who cannot review their own report) and for administrators. A reason is required and kept in the history.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const reason = String(body?.reason ?? "").trim().slice(0, 1000);
  if (reason.length < 10) return NextResponse.json({ error: "Give a reason of at least 10 characters. It is kept in the history." }, { status: 400 });

  const report = await prisma.supportReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  const tpl = getTemplate(report.reportType);
  if (tpl && !canUseTemplate(tpl, caller)) return NextResponse.json({ error: "You do not have access to this report." }, { status: 403 });
  if (report.reviewStatus !== "PENDING_REVIEW") return NextResponse.json({ error: "Only reports that are pending review can be withdrawn." }, { status: 409 });
  if (report.authorId !== caller.id && !caller.isAdmin) {
    return NextResponse.json({ error: "Only the person who filed the report or an administrator can withdraw it." }, { status: 403 });
  }

  await prisma.supportReport.update({
    where: { id: report.id },
    data: { reviewStatus: "WITHDRAWN", reviewedById: caller.id, reviewedByName: caller.username, reviewedAt: new Date(), reviewNote: reason },
  });
  await logReportEvent({ reportId: report.id, actorId: caller.id, actorName: caller.username, action: "WITHDRAWN", note: reason });
  await recordAudit({ actorId: caller.id, action: "SUPPORT_REPORT_WITHDRAWN", targetId: report.subjectUserId, details: { reportId: report.id, reason } });
  return NextResponse.json({ success: true });
}
