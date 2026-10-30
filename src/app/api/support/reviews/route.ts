import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminCaller } from "@/lib/staff-access";

export const dynamic = "force-dynamic";

/** Reports waiting for an administrator's decision, oldest first. */
export async function GET(request: Request) {
  const caller = await getAdminCaller();
  if (!caller) return NextResponse.json({ error: "Only administrators and the founder can review reports." }, { status: 403 });

  const status = new URL(request.url).searchParams.get("status") ?? "PENDING_REVIEW";
  const reports = await prisma.supportReport.findMany({
    where: { reviewStatus: status },
    orderBy: { createdAt: status === "PENDING_REVIEW" ? "asc" : "desc" },
    take: 200,
  });
  return NextResponse.json({ reports, viewerId: caller.id });
}
