import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupportCaller } from "@/lib/staff-access";
import { getTemplate, canUseTemplate } from "@/lib/support-reports";

export const dynamic = "force-dynamic";

const BRIEF = { id: true, reportType: true, summary: true, authorName: true, createdAt: true, reviewStatus: true } as const;

/** Full detail of one report: every answer, its review status, its history, and linked reports. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const report = await prisma.supportReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  const tpl = getTemplate(report.reportType);
  if (tpl && !canUseTemplate(tpl, caller)) return NextResponse.json({ error: "You do not have access to this report." }, { status: 403 });

  const [events, parent, children] = await Promise.all([
    prisma.supportReportEvent.findMany({ where: { reportId: params.id }, orderBy: { createdAt: "asc" } }),
    report.parentReportId ? prisma.supportReport.findUnique({ where: { id: report.parentReportId }, select: BRIEF }) : null,
    prisma.supportReport.findMany({ where: { parentReportId: params.id }, select: BRIEF, orderBy: { createdAt: "asc" } }),
  ]);
  return NextResponse.json({ report, events, parent, children, viewerId: caller.id, viewerIsAdmin: caller.isAdmin });
}
