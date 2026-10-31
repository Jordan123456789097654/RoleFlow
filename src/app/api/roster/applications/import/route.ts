import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";
import { mintRosterApplyHubToken } from "@/lib/roster-applyhub-token";

export const dynamic = "force-dynamic";

/**
 * Mint token & list accepted applicants for the manager in Roster UI
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

  let userRole: RosterRole | null = null;
  if (user?.id) {
    if (group.ownerUserId === user.id) {
      userRole = "OWNER";
    } else {
      const mem = group.memberships.find((m) => m.userId === user.id);
      if (mem) userRole = mem.role as RosterRole;
    }
  }

  if (!hasRosterPermission(userRole, "roster.import_application")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to import applicants into this roster." },
      { status: 403 }
    );
  }

  // Mint signed token
  const token = mintRosterApplyHubToken(user!.id, group.id);

  return NextResponse.json({ token });
}

/**
 * POST /api/roster/applications/import
 * One-click creation of staff record from accepted application (Workflow 4.4)
 * - Copies ONLY the fields the manager confirms (robloxUserId, username, rank, team, notes).
 * - Stores sourceApplicationId for the manager's audit trail.
 * - Creates atomic RosterAuditEntry.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json();
  const {
    groupId,
    applicationId,
    robloxUserId,
    username,
    rank,
    role,
    teamIds,
    notes,
  } = body;

  if (!groupId || !applicationId || !robloxUserId || !rank) {
    return NextResponse.json(
      { error: "groupId, applicationId, robloxUserId, and rank are required." },
      { status: 400 }
    );
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

  if (!hasRosterPermission(userRole, "roster.import_application")) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to import applications." },
      { status: 403 }
    );
  }

  // Atomic creation
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create or update RosterStaff record
    const staff = await tx.rosterStaff.upsert({
      where: {
        groupId_robloxUserId: {
          groupId: group.id,
          robloxUserId,
        },
      },
      update: {
        rank,
        status: "ACTIVE",
        notes: notes || undefined,
        sourceApplicationId: applicationId,
      },
      create: {
        groupId: group.id,
        robloxUserId,
        rank,
        status: "ACTIVE",
        notes: notes || null,
        sourceApplicationId: applicationId,
      },
    });

    // 2. Create or update RosterMembership record
    const membership = await tx.rosterMembership.upsert({
      where: {
        groupId_robloxUserId: {
          groupId: group.id,
          robloxUserId,
        },
      },
      update: {
        role: role || "STAFF",
        username: username || `User_${robloxUserId}`,
        teamIds: teamIds ? JSON.stringify(teamIds) : "[]",
        status: "ACTIVE",
      },
      create: {
        groupId: group.id,
        robloxUserId,
        username: username || `User_${robloxUserId}`,
        role: role || "STAFF",
        teamIds: teamIds ? JSON.stringify(teamIds) : "[]",
        status: "ACTIVE",
      },
    });

    // 3. Immutable audit log
    await tx.rosterAuditEntry.create({
      data: {
        groupId: group.id,
        actorUserId: user!.id,
        event: "APPLICANT_CONVERTED_TO_STAFF",
        detail: JSON.stringify({
          sourceApplicationId: applicationId,
          robloxUserId,
          username,
          rank,
          role: role || "STAFF",
          teamIds: teamIds || [],
        }),
      },
    });

    return { staff, membership };
  });

  return NextResponse.json({ ok: true, data: result });
}
