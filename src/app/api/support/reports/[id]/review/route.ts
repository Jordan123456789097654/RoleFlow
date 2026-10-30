import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getAdminCaller } from "@/lib/staff-access";
import { logReportEvent, postReportNotice } from "@/lib/report-webhook";
import { getTemplate, canUseTemplate } from "@/lib/support-reports";

export const dynamic = "force-dynamic";

const CHECKS = [
  "The facts in this report match the Discord ticket",
  "Every required answer is accurate and complete",
  "Any data removal was authorised and the identity check was done",
];

const STATUS: Record<string, { status: string; event: string; title: string; color: number }> = {
  VERIFIED: { status: "VERIFIED", event: "VERIFIED", title: "Report verified", color: 3066993 },
  REJECTED: { status: "REJECTED", event: "REJECTED", title: "Report rejected", color: 15158332 },
  NEEDS_CHANGES: { status: "NEEDS_CHANGES", event: "NEEDS_CHANGES", title: "Report needs changes", color: 16098851 },
};

/** Administrator or founder decision on a report. Reviewers cannot review their own reports. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const caller = await getAdminCaller();
  if (!caller) return NextResponse.json({ error: "Only administrators and the founder can review reports." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const decision = String(body?.decision ?? "");
  const note = String(body?.note ?? "").trim();
  const checklist: boolean[] = Array.isArray(body?.checklist) ? body.checklist.map((x: unknown) => x === true) : [];
  if (!STATUS[decision]) return NextResponse.json({ error: "Choose verify, reject, or needs changes." }, { status: 400 });

  const report = await prisma.supportReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  const tpl = getTemplate(report.reportType);
  if (tpl && !canUseTemplate(tpl, caller)) return NextResponse.json({ error: "You do not have access to this report." }, { status: 403 });
  if (report.authorId === caller.id) return NextResponse.json({ error: "You cannot review a report you filed." }, { status: 403 });
  if (report.reviewStatus !== "PENDING_REVIEW") return NextResponse.json({ error: "This report has already been reviewed." }, { status: 409 });

  if (decision === "VERIFIED") {
    if (checklist.length !== CHECKS.length || checklist.some((c) => !c)) {
      return NextResponse.json({ error: "Tick every check before verifying the report." }, { status: 400 });
    }
  } else if (note.length < 10) {
    return NextResponse.json({ error: "Explain the decision in at least 10 characters. The author will see it." }, { status: 400 });
  }

  const meta = STATUS[decision];
  const updated = await prisma.supportReport.update({
    where: { id: report.id },
    data: {
      reviewStatus: meta.status,
      reviewChecklist: decision === "VERIFIED" ? JSON.stringify(CHECKS.map((c, i) => ({ check: c, ticked: checklist[i] }))) : null,
      reviewedById: caller.id,
      reviewedByName: caller.username,
      reviewedAt: new Date(),
      reviewNote: note || null,
    },
  });

  await logReportEvent({ reportId: report.id, actorId: caller.id, actorName: caller.username, action: meta.event, note: note || null });
  await recordAudit({ actorId: caller.id, action: `SUPPORT_REPORT_${meta.event}`, targetId: report.subjectUserId, details: { reportId: report.id, note } });
  await postReportNotice({
    title: meta.title,
    color: meta.color,
    reportId: report.id,
    fields: [
      { name: "Report type", value: report.reportType },
      { name: "Filed by", value: report.authorName ?? "unknown" },
      { name: "Reviewed by", value: caller.username },
      { name: "Ticket", value: report.ticketRef ?? "none" },
      { name: "Note", value: note ? note.slice(0, 200) : "Verified", inline: false },
    ],
  });

  return NextResponse.json({ success: true, report: updated });
}
