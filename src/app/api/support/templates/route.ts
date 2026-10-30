import { NextResponse } from "next/server";
import { getSupportCaller } from "@/lib/staff-access";
import { REPORT_TEMPLATES, canUseTemplate } from "@/lib/support-reports";

export const dynamic = "force-dynamic";

export async function GET() {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(REPORT_TEMPLATES.filter((t) => canUseTemplate(t, caller)));
}
