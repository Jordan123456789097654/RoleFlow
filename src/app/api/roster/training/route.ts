import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/roster/training?groupId=...
 * Lists training sessions for the group
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

  const trainings = await prisma.rosterTraining.findMany({
    where: { groupId: group.id },
    include: {
      attendance: true,
    },
    orderBy: { startsAt: "desc" },
  });

  return NextResponse.json({
    groupId: group.id,
    trainings: trainings.map((t) => ({
      id: t.id,
      title: t.title,
      startsAt: t.startsAt.toISOString(),
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      attendeesCount: t.attendance.length,
      completedCount: t.attendance.filter((a) => a.completed).length,
      attendance: t.attendance.map((a) => ({
        id: a.id,
        robloxUserId: a.robloxUserId,
        completed: a.completed,
      })),
    })),
  });
}

/**
 * POST /api/roster/training
 * Create a new training session or checklist
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const { groupId, title, startsAt, attendeeRobloxUserIds } = body;

  if (!groupId || !title?.trim() || !startsAt) {
    return NextResponse.json(
      { error: "groupId, title, and startsAt are required." },
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

  if (!hasRosterPermission(userRole, "training.manage")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to manage training sessions." },
      { status: 403 }
    );
  }

  const training = await prisma.$transaction(async (tx) => {
    const created = await tx.rosterTraining.create({
      data: {
        groupId: group.id,
        title: title.trim(),
        startsAt: new Date(startsAt),
        createdBy: user!.id,
      },
    });

    if (Array.isArray(attendeeRobloxUserIds) && attendeeRobloxUserIds.length > 0) {
      await tx.rosterTrainingAttendance.createMany({
        data: attendeeRobloxUserIds.map((rId: string) => ({
          trainingId: created.id,
          robloxUserId: String(rId),
          completed: false,
        })),
        skipDuplicates: true,
      });
    }

    await tx.rosterAuditEntry.create({
      data: {
        groupId: group.id,
        actorUserId: user!.id,
        event: "TRAINING_CREATED",
        detail: JSON.stringify({
          trainingId: created.id,
          title: created.title,
          attendeesCount: attendeeRobloxUserIds?.length || 0,
        }),
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, training });
}

/**
 * PATCH /api/roster/training
 * Mark attendance / completion per staff member or close session
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const { trainingId, completedAttendeeIds, markSessionCompleted } = body;

  if (!trainingId) {
    return NextResponse.json({ error: "trainingId is required." }, { status: 400 });
  }

  const training = await prisma.rosterTraining.findUnique({
    where: { id: trainingId },
    include: { group: { include: { memberships: true } } },
  });

  if (!training || training.group.archivedAt) {
    return NextResponse.json({ error: "Training session not found." }, { status: 404 });
  }

  let userRole: RosterRole | null = null;
  if (user?.id) {
    if (training.group.ownerUserId === user.id) userRole = "OWNER";
    const mem = training.group.memberships.find((m) => m.userId === user.id);
    if (mem && !userRole) userRole = mem.role as RosterRole;
  }

  if (!hasRosterPermission(userRole, "training.manage")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to manage training sessions." },
      { status: 403 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Update individual attendance completion
    if (Array.isArray(completedAttendeeIds)) {
      // Set completed = true for listed ids
      await tx.rosterTrainingAttendance.updateMany({
        where: {
          trainingId: training.id,
          robloxUserId: { in: completedAttendeeIds },
        },
        data: { completed: true },
      });
      // Set completed = false for non-listed attendees in this session
      await tx.rosterTrainingAttendance.updateMany({
        where: {
          trainingId: training.id,
          robloxUserId: { notIn: completedAttendeeIds },
        },
        data: { completed: false },
      });
    }

    if (markSessionCompleted) {
      await tx.rosterTraining.update({
        where: { id: training.id },
        data: { completedAt: new Date() },
      });
    }

    await tx.rosterAuditEntry.create({
      data: {
        groupId: training.groupId,
        actorUserId: user!.id,
        event: "TRAINING_UPDATED",
        detail: JSON.stringify({
          trainingId: training.id,
          completedAttendeeIds,
          markSessionCompleted,
        }),
      },
    });

    return true;
  });

  return NextResponse.json({ ok: true, success: updated });
}
