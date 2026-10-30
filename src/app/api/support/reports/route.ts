import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getSupportCaller } from "@/lib/staff-access";
import { getTemplate, validateReport, REMOVAL_ITEM_LABELS } from "@/lib/support-reports";
import { logReportEvent, postReportNotice } from "@/lib/report-webhook";

export const dynamic = "force-dynamic";

/** File a report after handling a ticket or action. */
export async function POST(request: Request) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const tpl = getTemplate(String(body?.reportType ?? ""));
  if (!tpl) return NextResponse.json({ error: "Unknown report type." }, { status: 400 });

  const result = validateReport(tpl, body);
  if (typeof result === "string") return NextResponse.json({ error: result }, { status: 400 });

  // Link the report to a user account when the entry matches one.
  const match = result.subjectUsername
    ? await prisma.user.findFirst({
        where: { OR: [{ id: result.subjectUsername }, { username: result.subjectUsername }] },
        select: { id: true, username: true },
      })
    : null;

  const report = await prisma.supportReport.create({
    data: {
      reportType: result.reportType,
      ticketRef: result.ticketRef,
      subjectUsername: match?.username ?? result.subjectUsername,
      subjectUserId: match?.id ?? null,
      authorId: caller.id,
      authorName: caller.username,
      fieldsJson: JSON.stringify(result.fields),
      summary: result.summary,
    },
  });

  // Data removal reports also write one row per removed item to the removal log.
  if (tpl.id === "DATA_REMOVAL" && match) {
    const items = (result.fields.items as string[]) ?? [];
    await prisma.dataRemovalLog.createMany({
      data: items.map((item) => ({
        subjectUserId: match.id,
        subjectUsername: match.username,
        item,
        method: "RECORDED_ONLY",
        reason: String(result.fields.reason ?? ""),
        ticketRef: result.ticketRef,
        actorId: caller.id,
        actorName: caller.username,
        reportId: report.id,
      })),
    });
  }

  await recordAudit({ actorId: caller.id, action: "SUPPORT_REPORT_FILED", targetId: match?.id ?? null, details: { reportId: report.id, reportType: tpl.id, ticketRef: result.ticketRef } });
  await logReportEvent({ reportId: report.id, actorId: caller.id, actorName: caller.username, action: "CREATED", details: { reportType: tpl.id, ticketRef: result.ticketRef } });
  await postReportNotice({
    title: `New support report: ${tpl.label}`,
    color: 5793266,
    reportId: report.id,
    fields: [
      { name: "Filed by", value: caller.username },
      { name: "Ticket", value: result.ticketRef ?? "none" },
      { name: "User", value: report.subjectUsername ?? "none" },
      { name: "Summary", value: report.summary.slice(0, 120), inline: false },
    ],
  });
  return NextResponse.json({ success: true, report });
}

/** List reports. Filters: type, mine=1, q (matches ticket, user, or summary). */
export async function GET(request: Request) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim();
  const where: any = {};
  if (type) where.reportType = type;
  if (searchParams.get("mine") === "1") where.authorId = caller.id;
  if (q) {
    where.OR = [
      { ticketRef: { contains: q, mode: "insensitive" } },
      { subjectUsername: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const reports = await prisma.supportReport.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ reports, removalLabels: REMOVAL_ITEM_LABELS });
}
