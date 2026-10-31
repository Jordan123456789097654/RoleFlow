import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";
import { calculateStaffActivity, type ActivityWindow } from "@/lib/roster-activity";

export const dynamic = "force-dynamic";

/**
 * GET /api/roster/shifts?groupId=...&view=shifts|activity&days=7|30|90
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const view = searchParams.get("view") || "shifts";
  const days = Number(searchParams.get("days") || "30") as ActivityWindow;

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  const group = await prisma.rosterGroup.findUnique({
    where: { id: groupId },
    include: {
      teams: true,
      memberships: true,
      staffRecords: true,
    },
  });

  if (!group || group.archivedAt) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Activity Overview View (Spec 4.7: 7, 30, or 90 days counts)
  if (view === "activity") {
    const rawShifts = await prisma.rosterShiftAttendance.findMany({
      where: { shift: { groupId: group.id } },
      include: { shift: { select: { closedAt: true } } },
    });

    const rawTrainings = await prisma.rosterTrainingAttendance.findMany({
      where: { training: { groupId: group.id } },
      include: { training: { select: { completedAt: true, startsAt: true } } },
    });

    const rawActions = await prisma.rosterAction.findMany({
      where: { groupId: group.id, deletedAt: null },
      select: { actorUserId: true, targetRobloxUserId: true, createdAt: true },
    });

    const staffRobloxIds = group.staffRecords.map((s) => s.robloxUserId);

    const activityMap = calculateStaffActivity(
      staffRobloxIds,
      {
        shifts: rawShifts.map((s) => ({
          robloxUserId: s.robloxUserId,
          closedAt: s.shift.closedAt,
        })),
        trainings: rawTrainings.map((t) => ({
          robloxUserId: t.robloxUserId,
          completed: t.completed,
          completedAt: t.training.completedAt || t.training.startsAt,
        })),
        actions: rawActions.map((a) => ({
          actorUserId: a.actorUserId,
          targetRobloxUserId: a.targetRobloxUserId,
          createdAt: a.createdAt,
        })),
      },
      days
    );

    const activityList = Array.from(activityMap.values()).map((summary) => {
      const mem = group.memberships.find((m) => m.robloxUserId === summary.robloxUserId);
      const staff = group.staffRecords.find((s) => s.robloxUserId === summary.robloxUserId);
      return {
        ...summary,
        username: mem?.username || `User_${summary.robloxUserId}`,
        rank: staff?.rank || "Staff",
        status: staff?.status || "ACTIVE",
      };
    });

    return NextResponse.json({
      groupId: group.id,
      days,
      activity: activityList.sort((a, b) => b.totalScore - a.totalScore),
    });
  }

  // Shifts list view
  const shifts = await prisma.rosterShift.findMany({
    where: { groupId: group.id },
    include: {
      attendance: true,
    },
    orderBy: { startsAt: "desc" },
  });

  return NextResponse.json({
    groupId: group.id,
    shifts: shifts.map((s) => ({
      id: s.id,
      teamId: s.teamId,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      attendeesCount: s.attendance.length,
      attendance: s.attendance.map((a) => ({
        id: a.id,
        robloxUserId: a.robloxUserId,
        joinedAt: a.joinedAt.toISOString(),
      })),
    })),
  });
}

/**
 * POST /api/roster/shifts
 * Schedule a new shift
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const { groupId, teamId, startsAt, endsAt, attendeeRobloxUserIds } = body;

  if (!groupId || !startsAt || !endsAt) {
    return NextResponse.json(
      { error: "groupId, startsAt, and endsAt are required." },
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

  if (!hasRosterPermission(userRole, "shift.manage")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to schedule shifts." },
      { status: 403 }
    );
  }

  const shift = await prisma.$transaction(async (tx) => {
    const created = await tx.rosterShift.create({
      data: {
        groupId: group.id,
        teamId: teamId || null,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
    });

    if (Array.isArray(attendeeRobloxUserIds) && attendeeRobloxUserIds.length > 0) {
      await tx.rosterShiftAttendance.createMany({
        data: attendeeRobloxUserIds.map((rId: string) => ({
          shiftId: created.id,
          robloxUserId: String(rId),
        })),
        skipDuplicates: true,
      });
    }

    await tx.rosterAuditEntry.create({
      data: {
        groupId: group.id,
        actorUserId: user!.id,
        event: "SHIFT_SCHEDULED",
        detail: JSON.stringify({
          shiftId: created.id,
          startsAt: created.startsAt,
          endsAt: created.endsAt,
          teamId: created.teamId,
          attendeesCount: attendeeRobloxUserIds?.length || 0,
        }),
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, shift });
}

/**
 * PATCH /api/roster/shifts
 * Close shift or record completion
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const { shiftId, closeShift } = body;

  if (!shiftId) {
    return NextResponse.json({ error: "shiftId is required." }, { status: 400 });
  }

  const shift = await prisma.rosterShift.findUnique({
    where: { id: shiftId },
    include: { group: { include: { memberships: true } } },
  });

  if (!shift || shift.group.archivedAt) {
    return NextResponse.json({ error: "Shift not found." }, { status: 404 });
  }

  let userRole: RosterRole | null = null;
  if (user?.id) {
    if (shift.group.ownerUserId === user.id) userRole = "OWNER";
    const mem = shift.group.memberships.find((m) => m.userId === user.id);
    if (mem && !userRole) userRole = mem.role as RosterRole;
  }

  if (!hasRosterPermission(userRole, "shift.manage")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to manage shifts." },
      { status: 403 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.rosterShift.update({
      where: { id: shift.id },
      data: {
        closedAt: closeShift ? new Date() : undefined,
      },
    });

    await tx.rosterAuditEntry.create({
      data: {
        groupId: shift.groupId,
        actorUserId: user!.id,
        event: "SHIFT_CLOSED",
        detail: JSON.stringify({ shiftId: shift.id, closedAt: res.closedAt }),
      },
    });

    return res;
  });

  return NextResponse.json({ ok: true, shift: updated });
}
