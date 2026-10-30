import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { POLICY_SLUGS, getPolicy, validateSections } from "@/lib/policies";

export const dynamic = "force-dynamic";

/** Restore an earlier version. The version being replaced is saved first, so a restore can be undone. */
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(POLICY_SLUGS as readonly string[]).includes(params.slug)) return NextResponse.json({ error: "Unknown policy." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const rev = await prisma.policyRevision.findFirst({ where: { id: String(body?.revisionId ?? ""), slug: params.slug } });
  if (!rev) return NextResponse.json({ error: "Revision not found." }, { status: 404 });
  const sections = validateSections(JSON.parse(rev.sectionsJson));
  if (typeof sections === "string") return NextResponse.json({ error: sections }, { status: 400 });

  const previous = await getPolicy(params.slug);
  await prisma.policyRevision.create({
    data: { slug: params.slug, title: previous.title, subtitle: previous.subtitle, updated: previous.updated, sectionsJson: JSON.stringify(previous.sections), editorId: caller.id },
  });
  await prisma.policyDocument.upsert({
    where: { slug: params.slug },
    create: { slug: params.slug, title: rev.title, subtitle: rev.subtitle, updated: rev.updated, sectionsJson: rev.sectionsJson, updatedById: caller.id },
    update: { title: rev.title, subtitle: rev.subtitle, updated: rev.updated, sectionsJson: rev.sectionsJson, updatedById: caller.id },
  });
  await recordAudit({ actorId: caller.id, action: "POLICY_RESTORE", targetId: params.slug, details: { revisionId: rev.id } });
  return NextResponse.json({ success: true });
}
