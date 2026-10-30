import { NextResponse } from "next/server";
import { getSupportCaller } from "@/lib/staff-access";
import { getSiteDoc, isDocSlug } from "@/lib/site-docs-server";

export const dynamic = "force-dynamic";

/** Any support staff member can read the handbook and documentation. */
export async function GET(request: Request) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!isDocSlug(slug)) return NextResponse.json({ error: "Unknown document." }, { status: 404 });
  return NextResponse.json(await getSiteDoc(slug));
}
