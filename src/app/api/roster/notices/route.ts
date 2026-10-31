import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/roster/notices?groupId=...
 * Fetch notices for a group (visible to staff in target team or entire group)
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  const group = await prisma.rosterGroup.findUnique({
    where: { id: groupId },
    include: { memberships: true },
  });

  if (!group || group.archivedAt) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const notices = await prisma.rosterNotice.findMany({
    where: { groupId: group.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    groupId: group.id,
    notices: notices.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      targetTeamId: n.targetTeamId,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/roster/notices
 * Broadcast an in-app notice (and optional email to opted-in staff)
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const { groupId, title, content, targetTeamId } = body;

  if (!groupId || !title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "groupId, title, and content are required." },
      { status: 400 }
    );
  }

  const group = await prisma.rosterGroup.findUnique({
    where: { id: groupId },
    include: { memberships: true },
  });

  if (!group || group.archivedAt) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  let userRole: RosterRole | null = null;
  if (user?.id) {
    if (group.ownerUserId === user.id) userRole = "OWNER";
    const mem = group.memberships.find((m) => m.userId === user.id);
    if (mem && !userRole) userRole = mem.role as RosterRole;
  }

  if (!hasRosterPermission(userRole, "notice.broadcast")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to broadcast notices." },
      { status: 403 }
    );
  }

  const notice = await prisma.$transaction(async (tx) => {
    const created = await tx.rosterNotice.create({
      data: {
        groupId: group.id,
        authorUserId: user!.id,
        title: title.trim(),
        content: content.trim(),
        targetTeamId: targetTeamId || null,
      },
    });

    await tx.rosterAuditEntry.create({
      data: {
        groupId: group.id,
        actorUserId: user!.id,
        event: "NOTICE_BROADCASTED",
        detail: JSON.stringify({
          noticeId: created.id,
          title: created.title,
          targetTeamId: created.targetTeamId,
        }),
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, notice });
}
