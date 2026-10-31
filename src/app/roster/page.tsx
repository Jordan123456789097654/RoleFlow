import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, Sparkles, ArrowLeft, Users, Clock, FileCheck } from "lucide-react";
import { RosterGroupConnectManager } from "@/components/roster/RosterGroupConnectManager";
import { RosterDirectoryView } from "@/components/roster/RosterDirectoryView";
import type { StaffDirectoryItem } from "@/lib/roster-directory";

export const dynamic = "force-dynamic";

export default async function RosterPage({
  searchParams,
}: {
  searchParams?: { groupId?: string };
}) {
  const user = await getCurrentUser();

  // Strict check: if flag is off and user is not allowlisted/admin, render standard 404
  if (!canAccessRoster(user ? { userId: user.id, isSiteAdmin: user.isSiteAdmin, siteRole: user.siteRole } : null)) {
    notFound();
  }

  // Find user's roster groups or requested group
  const userGroups = user?.id
    ? await prisma.rosterGroup.findMany({
        where: {
          archivedAt: null,
          OR: [
            { ownerUserId: user.id },
            { memberships: { some: { userId: user.id } } },
          ],
        },
        include: {
          teams: true,
          memberships: true,
          staffRecords: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const activeGroupId = searchParams?.groupId || userGroups[0]?.id;
  const activeGroup = userGroups.find((g) => g.id === activeGroupId) || null;

  // If a group is active, assemble staff directory items
  let staffItems: StaffDirectoryItem[] = [];
  let availableRanks: string[] = [];
  let userRole: string | null = null;

  if (activeGroup && user?.id) {
    if (activeGroup.ownerUserId === user.id) {
      userRole = "OWNER";
    } else {
      const mem = activeGroup.memberships.find((m) => m.userId === user.id);
      if (mem) userRole = mem.role;
    }

    const rankCaches = await prisma.rosterRankCache.findMany({
      where: { groupId: activeGroup.id },
    });
    const rankMap = new Map<string, { rank: string; rankId: number }>();
    for (const rc of rankCaches) {
      rankMap.set(rc.robloxUserId, { rank: rc.rank, rankId: rc.rankId });
    }

    const shifts = await prisma.rosterShiftAttendance.findMany({
      where: { shift: { groupId: activeGroup.id } },
      include: { shift: true },
    });
    const trainings = await prisma.rosterTrainingAttendance.findMany({
      where: { training: { groupId: activeGroup.id } },
      include: { training: true },
    });
    const actions = await prisma.rosterAction.findMany({
      where: { groupId: activeGroup.id, deletedAt: null },
    });

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

    staffItems = activeGroup.staffRecords.map((staff) => {
      const mem = activeGroup.memberships.find((m) => m.robloxUserId === staff.robloxUserId);
      const cachedRank = rankMap.get(staff.robloxUserId);
      const parsedTeamIds: string[] = mem?.teamIds ? JSON.parse(mem.teamIds) : [];
      const staffTeams = activeGroup.teams
        .filter((t) => parsedTeamIds.includes(t.id))
        .map((t) => ({ id: t.id, name: t.name }));

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

    availableRanks = Array.from(new Set(staffItems.map((i) => i.rank)));
  }

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col justify-between selection:bg-violet-600/40">
      {/* Background radial atmosphere */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(90,42,162,0.45)_0%,rgba(67,29,130,0.2)_40%,transparent_70%)] blur-[90px]" />

      {/* Internal Navigation Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#08090f]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to RoleFlow</span>
            </Link>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">Roster by RoleFlow</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                STAGE 4 &bull; UNRELEASED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Allowlist: {user?.username || user?.id || "Authorized Preview"}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-8 w-full">
        {/* If user has an active group, show Roster Directory (Workflow 4.2) */}
        {activeGroup ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/60 px-4 py-1.5 text-xs font-semibold text-[#ddd6fe] shadow-[0_0_20px_rgba(90,42,162,0.35)] backdrop-blur-md mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  <span>Workflow 4.2: Staff Roster Active</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Staff Management &amp; Directory
                </h1>
              </div>

              {/* Group Selector if user owns/belongs to multiple */}
              {userGroups.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Group:</span>
                  <select
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0d0e15] text-xs text-white"
                    defaultValue={activeGroup.id}
                    onChange={(e) => {
                      window.location.href = `/roster?groupId=${e.target.value}`;
                    }}
                  >
                    {userGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Responsive Roster Directory */}
            <RosterDirectoryView
              initialStaff={staffItems}
              group={{
                id: activeGroup.id,
                robloxGroupId: activeGroup.robloxGroupId,
                name: activeGroup.name,
                iconUrl: activeGroup.iconUrl,
              }}
              teams={activeGroup.teams.map((t) => ({ id: t.id, name: t.name }))}
              availableRanks={availableRanks}
              currentUserRole={userRole}
            />
          </div>
        ) : (
          /* If no group connected, prompt to connect a group (Workflow 4.1) */
          <div className="max-w-4xl mx-auto space-y-8 text-center py-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/60 px-4 py-1.5 text-xs font-semibold text-[#ddd6fe] shadow-[0_0_20px_rgba(90,42,162,0.35)] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Stage 4: Staff Directory &amp; Group Import</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Staff &amp; Operations Management for <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-white via-[#ddd6fe] to-[#8b5cf6] bg-clip-text text-transparent">
                Roblox Groups.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
              Connect your Roblox group to verify permissions, review members and ranks, and import your staff directory with zero manual hassle.
            </p>

            {/* Workflow 4.1: Group Connect & Import UI */}
            <div className="pt-2 text-left">
              <RosterGroupConnectManager />
            </div>
          </div>
        )}

        {/* Feature Overview Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto pt-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md space-y-2">
            <Users className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-sm text-white">Staff Roster Directory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time member lists, Roblox ranks, custom teams, and status indicators.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md space-y-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Audited Actions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Formal moderation logs with strict 24-hour edit windows and immutable history.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md space-y-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Shifts &amp; Training</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Activity session tracking, checklists, and automated 7/30/90-day reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500 font-mono">
        Roster by RoleFlow &bull; Stage 4 Directory &bull; Confidential &amp; Unreleased
      </footer>
    </div>
  );
}
