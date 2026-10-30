import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { DOCS_KEY, getDocGroups, validateDocGroups } from "@/lib/docs-page";

export const dynamic = "force-dynamic";

/** Founder only: current documentation plus earlier versions, newest first. */
export async function GET() {
  if (!(await getFounderCaller())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [current, revisions] = await Promise.all([
    getDocGroups(),
    prisma.docsPageRevision.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return NextResponse.json({
    ...current,
    revisions: revisions.map((r) => {
      let groups: unknown = [];
      try { groups = JSON.parse(r.groupsJson); } catch { /* keep empty */ }
      return { id: r.id, createdAt: r.createdAt.toISOString(), editorId: r.editorId, groups };
    }),
  });
}

/** Founder only: save a new version. The previous version is kept so it can be restored. */
export async function PUT(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const checked = validateDocGroups(body?.groups);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const previous = await getDocGroups();
  await prisma.docsPageRevision.create({
    data: { groupsJson: JSON.stringify(previous.groups), editorId: caller.id },
  });
  const groupsJson = JSON.stringify(checked.groups);
  await prisma.docsPage.upsert({
    where: { key: DOCS_KEY },
    create: { key: DOCS_KEY, groupsJson, updatedById: caller.id },
    update: { groupsJson, updatedById: caller.id },
  });
  await recordAudit({
    actorId: caller.id,
    action: "DOCS_PAGE_UPDATE",
    details: { groups: checked.groups.length, sections: checked.groups.reduce((n, g) => n + g.sections.length, 0) },
  });
  return NextResponse.json({ success: true });
}

/** Founder only: go back to the built-in documentation. The old version is kept as a revision. */
export async function DELETE() {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const previous = await getDocGroups();
  await prisma.docsPageRevision.create({
    data: { groupsJson: JSON.stringify(previous.groups), editorId: caller.id },
  });
  await prisma.docsPage.deleteMany({ where: { key: DOCS_KEY } });
  await recordAudit({ actorId: caller.id, action: "DOCS_PAGE_RESET" });
  return NextResponse.json({ success: true });
}
