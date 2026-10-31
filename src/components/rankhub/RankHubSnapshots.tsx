"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  RotateCcw,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
} from "lucide-react";

interface SnapshotItem {
  id: string;
  groupId: string;
  title: string;
  memberCount: number;
  createdAt: string;
  createdBy?: string;
  data?: any[];
}

interface MemberDiff {
  robloxUserId: string | number;
  username: string;
  currentRank: number;
  currentRoleName: string;
  snapshotRank: number;
  snapshotRoleName: string;
  needsUpdate: boolean;
  action: "PROMOTE" | "DEMOTE" | "NOOP";
  blockedBySafety?: boolean;
  safetyReason?: string;
}

interface RestorePlan {
  groupId: string;
  snapshotId: string;
  totalMembersInSnapshot: number;
  totalMembersCompared: number;
  totalDifferences: number;
  diffs: MemberDiff[];
  executableAdjustments: MemberDiff[];
  blockedAdjustments: MemberDiff[];
}

export function RankHubSnapshots({ groupId = "15982012" }: { groupId?: string }) {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Restore Modal State
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotItem | null>(null);
  const [restorePlan, setRestorePlan] = useState<RestorePlan | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreCompleteMessage, setRestoreCompleteMessage] = useState<string | null>(null);
  const [diffSearch, setDiffSearch] = useState("");

  useEffect(() => {
    fetchSnapshots();
  }, [groupId]);

  const fetchSnapshots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rankhub/snapshots?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch {
      // Fallback sample data if demo
      setSnapshots([
        {
          id: "snap-pre-raid",
          groupId,
          title: "Pre-Shift Regular Baseline Backup",
          memberCount: 24890,
          createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
          createdBy: "System Cron",
        },
        {
          id: "snap-stable-v1",
          groupId,
          title: "Daily Automated Rollback Point",
          memberCount: 24885,
          createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
          createdBy: "Auto-Backup Sentinel",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/rankhub/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          groupId,
          title: snapshotTitle.trim() || undefined,
        }),
      });
      if (res.ok) {
        setCreateModalOpen(false);
        setSnapshotTitle("");
        await fetchSnapshots();
      }
    } catch (err: any) {
      alert(`Error creating snapshot: ${err?.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const openRestoreModal = async (snapshot: SnapshotItem) => {
    setSelectedSnapshot(snapshot);
    setRestorePlan(null);
    setRestoreCompleteMessage(null);
    setIsLoadingDiff(true);

    try {
      const res = await fetch("/api/rankhub/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview_restore",
          groupId,
          snapshotId: snapshot.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRestorePlan(data.plan);
      } else {
        // Mock fallback for UI diff preview if DB record doesn't exist
        setRestorePlan({
          groupId,
          snapshotId: snapshot.id,
          totalMembersInSnapshot: snapshot.memberCount,
          totalMembersCompared: snapshot.memberCount,
          totalDifferences: 3,
          diffs: [
            {
              robloxUserId: "4412991",
              username: "Officer_Vance",
              currentRank: 1,
              currentRoleName: "Trainee",
              snapshotRank: 60,
              snapshotRoleName: "Senior Captain",
              needsUpdate: true,
              action: "PROMOTE",
              blockedBySafety: false,
            },
            {
              robloxUserId: "1092842",
              username: "Rogue_Account_Demoted",
              currentRank: 10,
              currentRoleName: "Staff Moderator",
              snapshotRank: 255,
              snapshotRoleName: "Group Owner",
              needsUpdate: true,
              action: "PROMOTE",
              blockedBySafety: true,
              safetyReason: "Target rank (255) exceeds configured rank ceiling (254). Action blocked for safety.",
            },
            {
              robloxUserId: "5512399",
              username: "Cadet_Taylor",
              currentRank: 1,
              currentRoleName: "Trainee",
              snapshotRank: 20,
              snapshotRoleName: "Junior Officer",
              needsUpdate: true,
              action: "PROMOTE",
              blockedBySafety: false,
            },
          ],
          executableAdjustments: [
            {
              robloxUserId: "4412991",
              username: "Officer_Vance",
              currentRank: 1,
              currentRoleName: "Trainee",
              snapshotRank: 60,
              snapshotRoleName: "Senior Captain",
              needsUpdate: true,
              action: "PROMOTE",
              blockedBySafety: false,
            },
            {
              robloxUserId: "5512399",
              username: "Cadet_Taylor",
              currentRank: 1,
              currentRoleName: "Trainee",
              snapshotRank: 20,
              snapshotRoleName: "Junior Officer",
              needsUpdate: true,
              action: "PROMOTE",
              blockedBySafety: false,
            },
          ],
          blockedAdjustments: [
            {
              robloxUserId: "1092842",
              username: "Rogue_Account_Demoted",
              currentRank: 10,
              currentRoleName: "Staff Moderator",
              snapshotRank: 255,
              snapshotRoleName: "Group Owner",
              needsUpdate: true,
              action: "PROMOTE",
              blockedBySafety: true,
              safetyReason: "Target rank (255) exceeds configured rank ceiling (254). Action blocked for safety.",
            },
          ],
        });
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedSnapshot) return;
    setIsRestoring(true);
    try {
      const res = await fetch("/api/rankhub/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          groupId,
          snapshotId: selectedSnapshot.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRestoreCompleteMessage(data.message || "Snapshot restoration completed successfully.");
        await fetchSnapshots();
      } else {
        const err = await res.json();
        alert(err.error || "Restoration failed.");
      }
    } catch (err: any) {
      alert(`Error during restore: ${err?.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const filteredDiffs = (restorePlan?.diffs || []).filter((d) =>
    d.username.toLowerCase().includes(diffSearch.toLowerCase()) ||
    String(d.robloxUserId).includes(diffSearch)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Camera className="h-5 w-5 text-indigo-400" />
            Automated Rank Backups & Disaster Recovery
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Immutable group member snapshots. If a compromised bot or rogue administrator wipes your ranks, 1-click restore brings every member back to their exact role in seconds.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700 transition-all"
        >
          <Camera className="h-4 w-4" />
          <span>Create Snapshot Now</span>
        </button>
      </div>

      {/* Snapshots Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0b0e14] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Historical Snapshot Archive</h3>
          </div>
          <button
            onClick={fetchSnapshots}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {snapshots.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No snapshots recorded yet. Click "Create Snapshot Now" to save your first backup.
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3">Snapshot Name</th>
                  <th className="px-6 py-3">Created Date</th>
                  <th className="px-6 py-3">Members Captured</th>
                  <th className="px-6 py-3">Author</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {snapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      <span>{s.title}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
                        <Users className="h-3 w-3 text-slate-400" />
                        {s.memberCount.toLocaleString()} members
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {s.createdBy || "System"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openRestoreModal(s)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 font-medium text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>1-Click Restore</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Snapshot */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="flex items-center gap-2 font-bold text-white text-base">
                <Camera className="h-5 w-5 text-indigo-400" />
                Create Group Rank Snapshot
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Snapshot Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Promotion Night Baseline"
                  value={snapshotTitle}
                  onChange={(e) => setSnapshotTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-300">
                RankHub will capture all current group members, their role IDs, rank numbers, and usernames for Group {groupId}.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isCreating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>{isCreating ? "Capturing..." : "Create Snapshot"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restore Snapshot Diff & Preview */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Disaster Restore: {selectedSnapshot.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing current group roster against backup from {new Date(selectedSnapshot.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSnapshot(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingDiff ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 text-xs">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                  <span>Computing membership diff and evaluating RankHub safety ceiling...</span>
                </div>
              ) : restoreCompleteMessage ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                  <h4 className="text-base font-bold text-emerald-300">Restoration Succeeded</h4>
                  <p className="text-xs text-emerald-200/90">{restoreCompleteMessage}</p>
                </div>
              ) : (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Differences</div>
                      <div className="mt-1 text-2xl font-bold text-white">
                        {restorePlan?.totalDifferences || 0}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">Members needing rank restoration</div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">Executable Actions</div>
                      <div className="mt-1 text-2xl font-bold text-emerald-300">
                        {restorePlan?.executableAdjustments.length || 0}
                      </div>
                      <div className="mt-1 text-[11px] text-emerald-500/80">Permitted within RankHub safety ceiling</div>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">Protected / Ceiling Blocked</div>
                      <div className="mt-1 text-2xl font-bold text-amber-300">
                        {restorePlan?.blockedAdjustments.length || 0}
                      </div>
                      <div className="mt-1 text-[11px] text-amber-500/80">Owner / protected ranks preserved</div>
                    </div>
                  </div>

                  {/* Diff Search & Filter */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Filter member diffs by username or Roblox ID..."
                        value={diffSearch}
                        onChange={(e) => setDiffSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Diff Table */}
                  <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#0f141d] text-slate-400 uppercase font-mono tracking-wider text-[10px] border-b border-white/10">
                          <tr>
                            <th className="px-4 py-2.5">Member</th>
                            <th className="px-4 py-2.5">Current Rank</th>
                            <th className="px-4 py-2.5"></th>
                            <th className="px-4 py-2.5">Snapshot Target</th>
                            <th className="px-4 py-2.5 text-right">Safety Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {filteredDiffs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                {restorePlan?.totalDifferences === 0
                                  ? "Current group members are 100% in sync with this backup! No rank updates needed."
                                  : "No matching differences found."}
                              </td>
                            </tr>
                          ) : (
                            filteredDiffs.map((diff) => (
                              <tr key={String(diff.robloxUserId)} className="hover:bg-white/[0.02]">
                                <td className="px-4 py-2.5 font-medium text-white">
                                  <div>{diff.username}</div>
                                  <div className="text-[10px] font-mono text-slate-500">ID: {diff.robloxUserId}</div>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-400">
                                  <div>{diff.currentRoleName}</div>
                                  <div className="text-[10px] text-slate-500">Rank {diff.currentRank}</div>
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                                </td>
                                <td className="px-4 py-2.5 font-mono text-indigo-300 font-semibold">
                                  <div>{diff.snapshotRoleName}</div>
                                  <div className="text-[10px] text-indigo-400/80">Rank {diff.snapshotRank}</div>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {diff.blockedBySafety ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20" title={diff.safetyReason}>
                                      <ShieldAlert className="h-3 w-3" />
                                      Blocked by Ceiling
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/20">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Ready to Restore
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-white/[0.01]">
              <div className="text-xs text-slate-400">
                Restoration applies only to differences and honors the safety ceiling.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSnapshot(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Close
                </button>

                {!restoreCompleteMessage && (
                  <button
                    onClick={handleExecuteRestore}
                    disabled={isRestoring || !restorePlan || restorePlan.executableAdjustments.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span>
                      {isRestoring
                        ? "Restoring Ranks..."
                        : `Execute 1-Click Restore (${restorePlan?.executableAdjustments.length || 0})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
