import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { POLICY_SLUGS, getPolicy, validatePolicyBody } from "@/lib/policies";

export const dynamic = "force-dynamic";

function badSlug(slug: string) {
  return !(POLICY_SLUGS as readonly string[]).includes(slug);
}

/** Current content plus the previous versions, newest first. */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  if (!(await getFounderCaller())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (badSlug(params.slug)) return NextResponse.json({ error: "Unknown policy." }, { status: 404 });
  const revisions = await prisma.policyRevision.findMany({
    where: { slug: params.slug }, orderBy: { createdAt: "desc" }, take: 30,
    select: { id: true, title: true, updated: true, createdAt: true, editorId: true },
  });
  return NextResponse.json({ slug: params.slug, current: await getPolicy(params.slug), revisions });
}

/** Save a new version. The previous version is kept as a revision so it can be restored. */
export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (badSlug(params.slug)) return NextResponse.json({ error: "Unknown policy." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const next = validatePolicyBody(body);
  if (typeof next === "string") return NextResponse.json({ error: next }, { status: 400 });

  const previous = await getPolicy(params.slug);
  await prisma.policyRevision.create({
    data: { slug: params.slug, title: previous.title, subtitle: previous.subtitle, updated: previous.updated, sectionsJson: JSON.stringify(previous.sections), editorId: caller.id },
  });
  await prisma.policyDocument.upsert({
    where: { slug: params.slug },
    create: { slug: params.slug, title: next.title, subtitle: next.subtitle, updated: next.updated, sectionsJson: JSON.stringify(next.sections), updatedById: caller.id },
    update: { title: next.title, subtitle: next.subtitle, updated: next.updated, sectionsJson: JSON.stringify(next.sections), updatedById: caller.id },
  });
  await recordAudit({ actorId: caller.id, action: "POLICY_UPDATE", targetId: params.slug, details: { title: next.title, sections: next.sections.length } });
  return NextResponse.json({ success: true });
}

/** Remove the override and go back to the built-in text. The old version is kept as a revision. */
export async function DELETE(_req: Request, { params }: { params: { slug: string } }) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (badSlug(params.slug)) return NextResponse.json({ error: "Unknown policy." }, { status: 404 });

  const previous = await getPolicy(params.slug);
  await prisma.policyRevision.create({
    data: { slug: params.slug, title: previous.title, subtitle: previous.subtitle, updated: previous.updated, sectionsJson: JSON.stringify(previous.sections), editorId: caller.id },
  });
  await prisma.policyDocument.deleteMany({ where: { slug: params.slug } });
  await recordAudit({ actorId: caller.id, action: "POLICY_RESET", targetId: params.slug });
  return NextResponse.json({ success: true });
}
