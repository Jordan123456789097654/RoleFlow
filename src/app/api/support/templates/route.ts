import { NextResponse } from "next/server";
import { getSupportCaller } from "@/lib/staff-access";
import { REPORT_TEMPLATES } from "@/lib/support-reports";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSupportCaller())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(REPORT_TEMPLATES);
}
