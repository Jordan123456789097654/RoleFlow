import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import { hasRosterPermission, type RosterRole } from "@/lib/roster-permissions";
import { filterAndSortRoster, type StaffDirectoryItem } from "@/lib/roster-directory";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  // Strict allowlist / feature flag gate
  if (!canAccessRoster({ userId: user?.id })) {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  // Find the group
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

  // Determine current user's role in this group
  let userRole: RosterRole | null = null;
  if (user?.id) {
    if (group.ownerUserId === user.id) {
      userRole = "OWNER";
    } else {
      const membership = group.memberships.find((m) => m.userId === user.id);
      if (membership) {
        userRole = membership.role as RosterRole;
      }
    }
  }

  // Permission check: staff member can only view their own record unless they have MODERATOR/MANAGER/OWNER
  const canViewRoster = hasRosterPermission(userRole, "roster.view_full");
  if (!canViewRoster) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to view this group roster." },
      { status: 403 }
    );
  }

  // Fetch cached ranks if available
  const rankCaches = await prisma.rosterRankCache.findMany({
    where: { groupId: group.id },
  });
  const rankMap = new Map<string, { rank: string; rankId: number }>();
  for (const rc of rankCaches) {
    rankMap.set(rc.robloxUserId, { rank: rc.rank, rankId: rc.rankId });
  }

  // Fetch shift counts and recent activity dates
  const shifts = await prisma.rosterShiftAttendance.findMany({
    where: { shift: { groupId: group.id } },
    include: { shift: true },
  });

  const trainings = await prisma.rosterTrainingAttendance.findMany({
    where: { training: { groupId: group.id } },
    include: { training: true },
  });

  const actions = await prisma.rosterAction.findMany({
    where: { groupId: group.id, deletedAt: null },
  });

  // Build aggregate maps
  const shiftCounts = new Map<string, number>();
  const lastShiftMap = new Map<string, string>();
  for (const s of shifts) {
    shiftCounts.set(s.robloxUserId, (shiftCounts.get(s.robloxUserId) || 0) + 1);
    const d = s.shift.endsAt.toISOString();
    const cur = lastShiftMap.get(s.robloxUserId);
    if (!cur || new Date(d) > new Date(cur)) {
      lastShiftMap.set(s.robloxUserId, d);
    }
  }

  const trainingCounts = new Map<string, number>();
  const lastTrainingMap = new Map<string, string>();
  for (const t of trainings) {
    if (t.completed) {
      trainingCounts.set(t.robloxUserId, (trainingCounts.get(t.robloxUserId) || 0) + 1);
      const d = (t.training.completedAt || t.training.startsAt).toISOString();
      const cur = lastTrainingMap.get(t.robloxUserId);
      if (!cur || new Date(d) > new Date(cur)) {
        lastTrainingMap.set(t.robloxUserId, d);
      }
    }
  }

  const actionCounts = new Map<string, number>();
  for (const a of actions) {
    actionCounts.set(a.targetRobloxUserId, (actionCounts.get(a.targetRobloxUserId) || 0) + 1);
  }

  // Assemble directory items from staff records and memberships
  const items: StaffDirectoryItem[] = group.staffRecords.map((staff) => {
    const mem = group.memberships.find((m) => m.robloxUserId === staff.robloxUserId);
    const cachedRank = rankMap.get(staff.robloxUserId);
    const parsedTeamIds: string[] = mem?.teamIds ? JSON.parse(mem.teamIds) : [];
    const staffTeams = group.teams
      .filter((t) => parsedTeamIds.includes(t.id))
      .map((t) => ({ id: t.id, name: t.name }));

    // Compute last activity (latest of last shift or last training)
    const lastShift = lastShiftMap.get(staff.robloxUserId);
    const lastTrain = lastTrainingMap.get(staff.robloxUserId);
    let lastActivity: string | null = null;
    if (lastShift && lastTrain) {
      lastActivity = new Date(lastShift) > new Date(lastTrain) ? lastShift : lastTrain;
    } else {
      lastActivity = lastShift || lastTrain || null;
    }

    return {
      robloxUserId: staff.robloxUserId,
      username: mem?.username || `RobloxUser_${staff.robloxUserId}`,
      avatarUrl: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${staff.robloxUserId}&size=150x150&format=Png&isCircular=true`,
      rank: cachedRank?.rank || staff.rank,
      rankId: cachedRank?.rankId ?? 1,
      role: mem?.role || "STAFF",
      status: staff.status,
      teams: staffTeams,
      joinedAt: staff.joinedAt.toISOString(),
      lastActivity,
      shiftsCount: shiftCounts.get(staff.robloxUserId) || 0,
      trainingsCount: trainingCounts.get(staff.robloxUserId) || 0,
      actionsCount: actionCounts.get(staff.robloxUserId) || 0,
    };
  });

  // Parse filters & sorting from query params
  const search = searchParams.get("search") || undefined;
  const rank = searchParams.get("rank") || undefined;
  const teamId = searchParams.get("teamId") || undefined;
  const status = searchParams.get("status") || undefined;
  const sortBy = (searchParams.get("sortBy") as any) || "rank";
  const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

  const filteredItems = filterAndSortRoster(items, {
    search,
    rank,
    teamId,
    status,
    sortBy,
    sortOrder,
  });

  return NextResponse.json({
    group: {
      id: group.id,
      robloxGroupId: group.robloxGroupId,
      name: group.name,
      description: group.description,
      iconUrl: group.iconUrl,
      ownerUserId: group.ownerUserId,
    },
    currentUserRole: userRole,
    teams: group.teams.map((t) => ({ id: t.id, name: t.name })),
    availableRanks: Array.from(new Set(items.map((i) => i.rank))),
    totalCount: items.length,
    filteredCount: filteredItems.length,
    staff: filteredItems,
  });
}
