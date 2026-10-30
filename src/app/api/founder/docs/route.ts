import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { listSiteDocs, isDocSlug } from "@/lib/site-docs-server";
import { MAX_DOC_BODY } from "@/lib/site-docs";

export const dynamic = "force-dynamic";

/** Founder only: all documents. */
export async function GET() {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ docs: await listSiteDocs() });
}

/** Founder only: replace a document's title and text. Every save is written to the audit log. */
export async function POST(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const slug = String(body?.slug ?? "");
  const title = String(body?.title ?? "").trim().slice(0, 120);
  const text = String(body?.body ?? "").replace(/\r\n/g, "\n").trim();
  if (!isDocSlug(slug)) return NextResponse.json({ error: "Unknown document." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Give the document a title." }, { status: 400 });
  if (text.length > MAX_DOC_BODY) return NextResponse.json({ error: `Keep the text under ${MAX_DOC_BODY} characters.` }, { status: 400 });

  await prisma.siteDoc.upsert({
    where: { slug },
    create: { slug, title, body: text, updatedById: caller.id },
    update: { title, body: text, updatedById: caller.id },
  });
  await recordAudit({ actorId: caller.id, action: "SITE_DOC_UPDATED", details: { slug, title, length: text.length } });
  return NextResponse.json({ success: true });
}
