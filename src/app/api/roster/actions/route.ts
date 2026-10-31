import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";
import { exportActionsToCSV } from "@/lib/roster-actions-csv";

export const dynamic = "force-dynamic";

// Allowed moderation action types
const VALID_ACTION_TYPES = ["WARNING", "SUSPENSION", "REMOVAL", "NOTE", "COMMENDATION"];

/**
 * GET /api/roster/actions?groupId=...&format=csv|json&type=...&targetRobloxUserId=...
 * - Managers / Owners: View all actions.
 * - Staff: View only their own actions.
 * - Format=csv: Exports CSV (Managers / Owners only).
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const format = searchParams.get("format");
  const typeFilter = searchParams.get("type");
  const targetRobloxUserId = searchParams.get("targetRobloxUserId");

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

  let userRole: RosterRole | null = null;
  let callerRobloxUserId: string | null = null;

  if (user?.id) {
    if (group.ownerUserId === user.id) {
      userRole = "OWNER";
    }
    const mem = group.memberships.find((m) => m.userId === user.id);
    if (mem) {
      if (!userRole) userRole = mem.role as RosterRole;
      callerRobloxUserId = mem.robloxUserId;
    }
  }

  const isStaff = userRole === "STAFF";

  // Build query where clause
  const where: any = {
    groupId: group.id,
    deletedAt: null,
  };

  // Staff can only see their own actions
  if (isStaff) {
    if (!callerRobloxUserId) {
      return NextResponse.json({ actions: [] });
    }
    where.targetRobloxUserId = callerRobloxUserId;
  } else if (targetRobloxUserId) {
    where.targetRobloxUserId = targetRobloxUserId;
  }

  if (typeFilter && typeFilter !== "ALL") {
    where.type = typeFilter;
  }

  // Handle CSV export request
  if (format === "csv") {
    if (!hasRosterPermission(userRole, "action.export_csv")) {
      return NextResponse.json(
        { error: "Forbidden: Only managers and owners can export action logs to CSV." },
        { status: 403 }
      );
    }

    const actions = await prisma.rosterAction.findMany({
      where,
      include: {
        actor: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const csvRecords = actions.map((a) => ({
      id: a.id,
      type: a.type,
      targetRobloxUserId: a.targetRobloxUserId,
      actorUsername: a.actor.username || "Staff Admin",
      reason: a.reason,
      durationMinutes: a.durationMinutes,
      createdAt: a.createdAt.toISOString(),
      editedAt: a.editedAt ? a.editedAt.toISOString() : null,
    }));

    const csvContent = exportActionsToCSV(csvRecords);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="roster-actions-${group.robloxGroupId}.csv"`,
      },
    });
  }

  // Regular JSON fetch
  const actions = await prisma.rosterAction.findMany({
    where,
    include: {
      actor: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const mapped = actions.map((a) => {
    const ageMinutes = Math.floor((now - a.createdAt.getTime()) / (1000 * 60));
    const isAuthor = Boolean(user?.id && a.actorUserId === user.id);
    const canEdit = isAuthor && ageMinutes <= 1440; // 24-hour edit window

    return {
      id: a.id,
      type: a.type,
      targetRobloxUserId: a.targetRobloxUserId,
      reason: a.reason,
      durationMinutes: a.durationMinutes,
      actorUserId: a.actorUserId,
      actorUsername: a.actor.username || "Staff Admin",
      createdAt: a.createdAt.toISOString(),
      editedAt: a.editedAt ? a.editedAt.toISOString() : null,
      canEdit,
      minutesUntilLock: Math.max(0, 1440 - ageMinutes),
    };
  });

  return NextResponse.json({
    groupId: group.id,
    userRole,
    actions: mapped,
  });
}

/**
 * POST /api/roster/actions
 * Log a new moderation action
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const { groupId, targetRobloxUserId, type, reason, durationMinutes } = body;

  if (!groupId || !targetRobloxUserId || !type || !reason?.trim()) {
    return NextResponse.json(
      { error: "groupId, targetRobloxUserId, type, and reason are required." },
      { status: 400 }
    );
  }

  if (!VALID_ACTION_TYPES.includes(type.toUpperCase())) {
    return NextResponse.json(
      { error: `Invalid action type. Allowed: ${VALID_ACTION_TYPES.join(", ")}` },
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
    if (group.ownerUserId === user.id) {
      userRole = "OWNER";
    }
    const mem = group.memberships.find((m) => m.userId === user.id);
    if (mem && !userRole) userRole = mem.role as RosterRole;
  }

  if (!hasRosterPermission(userRole, "action.log")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to log moderation actions." },
      { status: 403 }
    );
  }

  const action = await prisma.$transaction(async (tx) => {
    const created = await tx.rosterAction.create({
      data: {
        groupId: group.id,
        targetRobloxUserId,
        actorUserId: user!.id,
        type: type.toUpperCase(),
        reason: reason.trim(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      },
    });

    await tx.rosterAuditEntry.create({
      data: {
        groupId: group.id,
        actorUserId: user!.id,
        event: "ACTION_LOGGED",
        detail: JSON.stringify({
          actionId: created.id,
          targetRobloxUserId,
          type: created.type,
          reason: created.reason,
          durationMinutes: created.durationMinutes,
        }),
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, action });
}

/**
 * PATCH /api/roster/actions
 * Edit an action (Within 24 hours only, by the original author only)
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const { actionId, reason, type } = body;

  if (!actionId || (!reason?.trim() && !type)) {
    return NextResponse.json(
      { error: "actionId and updated reason or type are required." },
      { status: 400 }
    );
  }

  const action = await prisma.rosterAction.findUnique({
    where: { id: actionId },
  });

  if (!action || action.deletedAt) {
    return NextResponse.json({ error: "Action not found or has been removed." }, { status: 404 });
  }

  // 24-hour edit window check: 1440 minutes
  const ageMinutes = Math.floor((Date.now() - action.createdAt.getTime()) / (1000 * 60));
  const isAuthor = user?.id && action.actorUserId === user.id;

  if (!isAuthor) {
    return NextResponse.json(
      { error: "Forbidden: Actions can only be edited by the person who originally logged them." },
      { status: 403 }
    );
  }

  if (ageMinutes > 1440) {
    return NextResponse.json(
      { error: "Forbidden: Actions become strictly read-only 24 hours after creation." },
      { status: 403 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.rosterAction.update({
      where: { id: action.id },
      data: {
        reason: reason ? reason.trim() : undefined,
        type: type ? type.toUpperCase() : undefined,
        editedAt: new Date(),
      },
    });

    await tx.rosterAuditEntry.create({
      data: {
        groupId: action.groupId,
        actorUserId: user!.id,
        event: "ACTION_EDITED",
        detail: JSON.stringify({
          actionId: action.id,
          previous: { reason: action.reason, type: action.type },
          updated: { reason: res.reason, type: res.type },
        }),
      },
    });

    return res;
  });

  return NextResponse.json({ ok: true, action: updated });
}
