import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionValue } from "@/lib/session";
import { fetchLinkPreview } from "@/lib/link-preview";

export const dynamic = "force-dynamic";

/** Preview card for a link an applicant submitted. Signed-in users only. */
export async function GET(request: Request) {
  const userId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url).searchParams.get("url") || "";
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const result = await fetchLinkPreview(url);
    if ("error" in result) return NextResponse.json(result, { status: 422 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Couldn't load that link." }, { status: 422 });
  }
}
