import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getSupportCaller } from "@/lib/staff-access";
import { getTemplate, canUseTemplate } from "@/lib/support-reports";
import { logReportEvent } from "@/lib/report-webhook";

export const dynamic = "force-dynamic";

/** Ticket handling status. Separate from the verification decision (verify, reject, needs changes). */
export const TICKET_STATUSES: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_ON_USER: "Waiting on user",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

/** Support staff who can see a report can change its ticket status. Notes are optional but kept in the history. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const status = String(body?.status ?? "");
  const note = String(body?.note ?? "").trim().slice(0, 1000);
  if (!TICKET_STATUSES[status]) return NextResponse.json({ error: "Unknown status." }, { status: 400 });

  const report = await prisma.supportReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  const tpl = getTemplate(report.reportType);
  if (tpl && !canUseTemplate(tpl, caller)) return NextResponse.json({ error: "You do not have access to this report." }, { status: 403 });
  if (report.workflowStatus === status) return NextResponse.json({ error: `Already ${TICKET_STATUSES[status].toLowerCase()}.` }, { status: 409 });

  const previous = report.workflowStatus;
  const updated = await prisma.supportReport.update({ where: { id: report.id }, data: { workflowStatus: status } });
  await logReportEvent({
    reportId: report.id,
    actorId: caller.id,
    actorName: caller.username,
    action: `STATUS_${status}`,
    note: note || `Status changed from ${TICKET_STATUSES[previous] ?? previous} to ${TICKET_STATUSES[status]}`,
  });
  await recordAudit({ actorId: caller.id, action: "SUPPORT_REPORT_STATUS", targetId: report.subjectUserId, details: { reportId: report.id, from: previous, to: status, note } });
  return NextResponse.json({ success: true, workflowStatus: updated.workflowStatus });
}
