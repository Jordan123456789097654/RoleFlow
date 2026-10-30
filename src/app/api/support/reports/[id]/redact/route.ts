import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getAdminCaller } from "@/lib/staff-access";
import { getTemplate, canUseTemplate } from "@/lib/support-reports";
import { logReportEvent } from "@/lib/report-webhook";

export const dynamic = "force-dynamic";

const MARK = "[REDACTED]";

/**
 * Permanently removes the values of chosen answers from a report. The values are not kept anywhere,
 * including the history. The history records which fields were redacted, by whom, and why.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const caller = await getAdminCaller();
  if (!caller) return NextResponse.json({ error: "Only administrators and the founder can redact reports." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const keys: string[] = Array.isArray(body?.fields) ? body.fields.map(String) : [];
  const reason = String(body?.reason ?? "").trim();
  if (keys.length === 0) return NextResponse.json({ error: "Choose at least one answer to redact." }, { status: 400 });
  if (reason.length < 10) return NextResponse.json({ error: "Give a reason of at least 10 characters. The reason is kept in the history." }, { status: 400 });

  const report = await prisma.supportReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const tpl = getTemplate(report.reportType);
  if (tpl && !canUseTemplate(tpl, caller)) return NextResponse.json({ error: "You do not have access to this report." }, { status: 403 });
  const answers = JSON.parse(report.fieldsJson || "{}") as Record<string, any>;
  const redactable = new Set(
    (tpl?.fields ?? []).filter((f) => f.kind === "text" || f.kind === "textarea" || f.kind === "select").map((f) => f.key)
  );
  const invalid = keys.filter((k) => !redactable.has(k) || !(k in answers));
  if (invalid.length) return NextResponse.json({ error: "Some answers cannot be redacted." }, { status: 400 });

  // Captured before changing anything, so the summary can be cleared if it repeats a redacted answer.
  const originals = keys.map((k) => answers[k]);
  for (const k of keys) answers[k] = MARK;
  const summaryLeaks = originals.some((v) => typeof v === "string" && v && v === report.summary);

  const alreadyRedacted = JSON.parse(report.redactedFields || "[]") as string[];
  const allRedacted = Array.from(new Set([...alreadyRedacted, ...keys]));

  await prisma.supportReport.update({
    where: { id: report.id },
    data: {
      fieldsJson: JSON.stringify(answers),
      redactedFields: JSON.stringify(allRedacted),
      summary: summaryLeaks ? MARK : report.summary,
    },
  });

  await logReportEvent({ reportId: report.id, actorId: caller.id, actorName: caller.username, action: "REDACTED", note: reason, details: { fields: keys } });
  await recordAudit({ actorId: caller.id, action: "SUPPORT_REPORT_REDACTED", targetId: report.subjectUserId, details: { reportId: report.id, fields: keys, reason } });
  return NextResponse.json({ success: true, redacted: allRedacted });
}
