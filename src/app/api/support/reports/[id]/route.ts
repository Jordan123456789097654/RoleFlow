import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupportCaller } from "@/lib/staff-access";

export const dynamic = "force-dynamic";

/** Full detail of one report: every answer, its review status, and its complete history. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const report = await prisma.supportReport.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const events = await prisma.supportReportEvent.findMany({ where: { reportId: params.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ report, events, viewerId: caller.id, viewerIsAdmin: caller.isAdmin });
}
