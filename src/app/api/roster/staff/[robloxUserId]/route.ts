import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";

export const dynamic = "force-dynamic";

// GET /api/roster/staff/[robloxUserId]?groupId=...
export async function GET(
  request: Request,
  { params }: { params: { robloxUserId: string } }
) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const targetRobloxUserId = params.robloxUserId;

  if (!groupId || !targetRobloxUserId) {
    return NextResponse.json({ error: "groupId and robloxUserId are required" }, { status: 400 });
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

  // Determine current user's membership in this group
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

  const isTargetSelf = Boolean(callerRobloxUserId && callerRobloxUserId === targetRobloxUserId);

  // Permission check: staff can see their own record only
  const canView = hasRosterPermission(userRole, "staff.view_record", { isTargetSelf });
  if (!canView) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to view this staff record." },
      { status: 403 }
    );
  }

  // Find staff record
  const staff = group.staffRecords.find((s) => s.robloxUserId === targetRobloxUserId);
  if (!staff) {
    return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
  }

  const targetMembership = group.memberships.find((m) => m.robloxUserId === targetRobloxUserId);
  const parsedTeamIds: string[] = targetMembership?.teamIds ? JSON.parse(targetMembership.teamIds) : [];
  const assignedTeams = group.teams.filter((t) => parsedTeamIds.includes(t.id));

  // Moderation action history
  // If user is STAFF (self-view), they only see actions where they were the target, or if manager they see all
  const actions = await prisma.rosterAction.findMany({
    where: {
      groupId: group.id,
      targetRobloxUserId,
      deletedAt: null,
    },
    include: {
      actor: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Training history
  const trainings = await prisma.rosterTrainingAttendance.findMany({
    where: {
      robloxUserId: targetRobloxUserId,
      training: { groupId: group.id },
    },
    include: {
      training: true,
    },
    orderBy: { training: { startsAt: "desc" } },
  });

  // Shift history
  const shifts = await prisma.rosterShiftAttendance.findMany({
    where: {
      robloxUserId: targetRobloxUserId,
      shift: { groupId: group.id },
    },
    include: {
      shift: true,
    },
    orderBy: { shift: { startsAt: "desc" } },
  });

  const canEdit = hasRosterPermission(userRole, "staff.edit_record");

  return NextResponse.json({
    staff: {
      id: staff.id,
      groupId: group.id,
      robloxUserId: staff.robloxUserId,
      username: targetMembership?.username || `RobloxUser_${staff.robloxUserId}`,
      avatarUrl: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${staff.robloxUserId}&size=150x150&format=Png&isCircular=true`,
      rank: staff.rank,
      role: targetMembership?.role || "STAFF",
      status: staff.status,
      notes: canEdit ? staff.notes : null, // Notes are confidential to managers/owners
      joinedAt: staff.joinedAt.toISOString(),
      updatedAt: staff.updatedAt.toISOString(),
      sourceApplicationId: canEdit ? staff.sourceApplicationId : null,
      teams: assignedTeams.map((t) => ({ id: t.id, name: t.name })),
    },
    history: {
      actions: actions.map((a) => ({
        id: a.id,
        type: a.type,
        reason: a.reason,
        durationMinutes: a.durationMinutes,
        actorUsername: a.actor.username || "Staff Admin",
        createdAt: a.createdAt.toISOString(),
        editedAt: a.editedAt ? a.editedAt.toISOString() : null,
      })),
      trainings: trainings.map((t) => ({
        id: t.id,
        trainingId: t.trainingId,
        title: t.training.title,
        startsAt: t.training.startsAt.toISOString(),
        completedAt: t.training.completedAt ? t.training.completedAt.toISOString() : null,
        completed: t.completed,
      })),
      shifts: shifts.map((s) => ({
        id: s.id,
        shiftId: s.shiftId,
        startsAt: s.shift.startsAt.toISOString(),
        endsAt: s.shift.endsAt.toISOString(),
        closedAt: s.shift.closedAt ? s.shift.closedAt.toISOString() : null,
      })),
    },
    capabilities: {
      canEdit,
      isTargetSelf,
    },
  });
}

// PATCH /api/roster/staff/[robloxUserId]?groupId=...
export async function PATCH(
  request: Request,
  { params }: { params: { robloxUserId: string } }
) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const targetRobloxUserId = params.robloxUserId;

  if (!groupId || !targetRobloxUserId) {
    return NextResponse.json({ error: "groupId and robloxUserId are required" }, { status: 400 });
  }

  const group = await prisma.rosterGroup.findUnique({
    where: { id: groupId },
    include: { memberships: true, staffRecords: true },
  });

  if (!group || group.archivedAt) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  let userRole: RosterRole | null = null;
  if (user?.id) {
    if (group.ownerUserId === user.id) {
      userRole = "OWNER";
    } else {
      const mem = group.memberships.find((m) => m.userId === user.id);
      if (mem) userRole = mem.role as RosterRole;
    }
  }

  // Only Owner and Manager can edit staff records
  if (!hasRosterPermission(userRole, "staff.edit_record")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to edit staff records." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { status, notes, teamIds, role } = body;

  const staff = group.staffRecords.find((s) => s.robloxUserId === targetRobloxUserId);
  if (!staff) {
    return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
  }

  // Atomic update with audit entry
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update RosterStaff record
    const updatedStaff = await tx.rosterStaff.update({
      where: {
        groupId_robloxUserId: {
          groupId: group.id,
          robloxUserId: targetRobloxUserId,
        },
      },
      data: {
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    // 2. Update RosterMembership if role or teams changed
    if (teamIds !== undefined || role !== undefined) {
      await tx.rosterMembership.updateMany({
        where: {
          groupId: group.id,
          robloxUserId: targetRobloxUserId,
        },
        data: {
          role: role !== undefined ? role : undefined,
          teamIds: teamIds !== undefined ? JSON.stringify(teamIds) : undefined,
          status: status !== undefined ? status : undefined,
        },
      });
    }

    // 3. Log audit entry
    await tx.rosterAuditEntry.create({
      data: {
        groupId: group.id,
        actorUserId: user!.id,
        event: "STAFF_RECORD_UPDATED",
        detail: JSON.stringify({
          targetRobloxUserId,
          changes: {
            status: status !== undefined ? { from: staff.status, to: status } : undefined,
            notes: notes !== undefined ? { from: staff.notes, to: notes } : undefined,
            role: role !== undefined ? { to: role } : undefined,
            teamIds: teamIds !== undefined ? { to: teamIds } : undefined,
          },
        }),
      },
    });

    return updatedStaff;
  });

  return NextResponse.json({ ok: true, staff: updated });
}
