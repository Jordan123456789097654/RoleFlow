"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Shield,
  Briefcase,
  Clock,
  Sparkles,
  ChevronRight,
  UserCheck,
  AlertCircle,
  ExternalLink,
  FileText,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import type { StaffDirectoryItem } from "@/lib/roster-directory";
import { StaffRecordModal } from "./StaffRecordModal";
import { AcceptedApplicantsModal } from "./AcceptedApplicantsModal";
import { ModerationLogModal } from "./ModerationLogModal";

type Props = {
  initialStaff: StaffDirectoryItem[];
  group: {
    id: string;
    robloxGroupId: string;
    name: string;
    iconUrl?: string | null;
  };
  teams: Array<{ id: string; name: string }>;
  availableRanks: string[];
  currentUserRole: string | null;
};

export function RosterDirectoryView({
  initialStaff,
  group,
  teams,
  availableRanks,
  currentUserRole,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedRank, setSelectedRank] = useState("ALL");
  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState<"name" | "rank" | "lastActivity" | "joinedAt">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [inspectRobloxUserId, setInspectRobloxUserId] = useState<string | null>(null);
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const [showModLogModal, setShowModLogModal] = useState(false);

  const canImportApplicants = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  // Client-side instant filtering for rapid responsiveness
  const filteredStaff = useMemo(() => {
    return initialStaff
      .filter((item) => {
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matches =
            item.username.toLowerCase().includes(q) ||
            item.robloxUserId.toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (selectedRank !== "ALL" && item.rank !== selectedRank) return false;
        if (selectedTeam !== "ALL" && !item.teams.some((t) => t.id === selectedTeam))
          return false;
        if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => {
        const direction = sortOrder === "asc" ? 1 : -1;
        switch (sortBy) {
          case "name":
            return a.username.localeCompare(b.username) * direction;
          case "rank":
            if (a.rankId !== b.rankId) {
              return (a.rankId - b.rankId) * direction;
            }
            return a.username.localeCompare(b.username);
          case "joinedAt":
            return (
              (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()) * direction
            );
          case "lastActivity": {
            const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
            const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
            return (timeA - timeB) * direction;
          }
          default:
            return 0;
        }
      });
  }, [initialStaff, search, selectedRank, selectedTeam, selectedStatus, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="w-full space-y-6">
      {/* Group Header Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {group.iconUrl ? (
            <img
              src={group.iconUrl}
              alt={group.name}
              className="w-14 h-14 rounded-2xl border border-violet-500/30 object-cover shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {group.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">{group.name}</h2>
              <a
                href={`https://www.roblox.com/groups/${group.robloxGroupId}`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                title="View on Roblox"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Roblox Group ID: {group.robloxGroupId} &bull; {initialStaff.length} Total Staff
            </p>
          </div>
        </div>

        {/* Controls and Role Pill */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowModLogModal(true)}
            className="px-3.5 py-1.5 rounded-full border border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-indigo-950/40 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Moderation Log</span>
          </button>

          {canImportApplicants && (
            <button
              type="button"
              onClick={() => setShowAcceptedModal(true)}
              className="px-3.5 py-1.5 rounded-full border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/30 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-violet-300" />
              <span>Import Applicants</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-950/40 text-violet-300 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Role: {currentUserRole || "Staff"}</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar (Fully responsive, no horizontal scroll) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md space-y-4">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Roblox username or user ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0d0e15] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and Sorting Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Rank Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Rank
            </label>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0d0e15] text-slate-200 focus:outline-none focus:border-violet-500/60"
            >
              <option value="ALL">All Ranks ({availableRanks.length})</option>
              {availableRanks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0d0e15] text-slate-200 focus:outline-none focus:border-violet-500/60"
            >
              <option value="ALL">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0d0e15] text-slate-200 focus:outline-none focus:border-violet-500/60"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sort By</span>
              <button
                type="button"
                onClick={toggleSortOrder}
                className="text-violet-400 hover:text-violet-300 font-mono normal-case inline-flex items-center gap-1"
                title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{sortOrder.toUpperCase()}</span>
              </button>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#0d0e15] text-slate-200 focus:outline-none focus:border-violet-500/60"
            >
              <option value="rank">Roblox Rank</option>
              <option value="name">Staff Username</option>
              <option value="lastActivity">Last Activity</option>
              <option value="joinedAt">Join Date</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1 border-t border-white/5">
          <span>
            Showing <strong>{filteredStaff.length}</strong> of {initialStaff.length} staff members
          </span>
          {(search || selectedRank !== "ALL" || selectedTeam !== "ALL" || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedRank("ALL");
                setSelectedTeam("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-violet-400 hover:text-violet-300"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Staff Roster Cards / Table (Mobile-friendly list without horizontal scrolling) */}
      {filteredStaff.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="font-bold text-base text-white">No staff members match this filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, rank selection, or team filters to see more results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredStaff.map((staff) => (
            <div
              key={staff.robloxUserId}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/30 transition-all p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Member Identity */}
              <div className="flex items-center gap-3.5">
                <img
                  src={staff.avatarUrl}
                  alt={staff.username}
                  className="w-12 h-12 rounded-full border border-white/10 bg-black/40 object-cover flex-shrink-0"
                  onError={(e) => {
                    // Fallback to placeholder avatar
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white truncate">
                      {staff.username}
                    </span>
                    {/* Status Pill */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        staff.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : staff.status === "ON_LEAVE"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {staff.status}
                    </span>
                    {/* Permission Role Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {staff.role}
                    </span>
                  </div>

                  {/* Rank and Teams */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span className="text-slate-300 font-medium">Rank: {staff.rank}</span>
                    {staff.teams.length > 0 && (
                      <>
                        <span className="text-white/20">&bull;</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {staff.teams.map((t) => (
                            <span
                              key={t.id}
                              className="px-1.5 py-0.5 rounded bg-white/5 text-[11px] text-slate-300 font-medium"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity & Stats (Stacks cleanly on mobile) */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  {/* Shifts */}
                  <div className="text-left sm:text-right">
                    <div className="font-bold text-white font-mono text-sm">
                      {staff.shiftsCount}
                    </div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                      Shifts
                    </div>
                  </div>

                  {/* Trainings */}
                  <div className="text-left sm:text-right">
                    <div className="font-bold text-white font-mono text-sm">
                      {staff.trainingsCount}
                    </div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                      Training
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="text-left sm:text-right">
                    <div className="text-white font-medium text-xs">
                      {staff.lastActivity
                        ? new Date(staff.lastActivity).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "None"}
                    </div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                      Last Active
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInspectRobloxUserId(staff.robloxUserId)}
                    className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white border border-violet-500/30 transition-colors inline-flex items-center gap-1.5 font-medium text-xs"
                    title="View Full Staff Dossier"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Dossier</span>
                  </button>

                  <a
                    href={`https://www.roblox.com/users/${staff.robloxUserId}/profile`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-violet-600/20 text-slate-400 hover:text-white transition-colors"
                    title="View Roblox Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Dossier Modal */}
      {inspectRobloxUserId && (
        <StaffRecordModal
          groupId={group.id}
          robloxUserId={inspectRobloxUserId}
          availableTeams={teams}
          onClose={() => setInspectRobloxUserId(null)}
          onStaffUpdated={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Accepted ApplyHub Applicants Modal */}
      {showAcceptedModal && (
        <AcceptedApplicantsModal
          groupId={group.id}
          availableTeams={teams}
          availableRanks={availableRanks}
          onClose={() => setShowAcceptedModal(false)}
          onImportComplete={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Moderation Log Modal (Workflow 4.5) */}
      {showModLogModal && (
        <ModerationLogModal
          groupId={group.id}
          robloxGroupId={group.robloxGroupId}
          currentUserRole={currentUserRole}
          staffList={initialStaff.map((s) => ({
            robloxUserId: s.robloxUserId,
            username: s.username,
          }))}
          onClose={() => setShowModLogModal(false)}
        />
      )}
    </div>
  );
}
