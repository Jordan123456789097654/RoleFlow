"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Download,
  Plus,
  Clock,
  Shield,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Filter,
} from "lucide-react";

type ActionItem = {
  id: string;
  type: string;
  targetRobloxUserId: string;
  reason: string;
  durationMinutes: number | null;
  actorUserId: string;
  actorUsername: string;
  createdAt: string;
  editedAt: string | null;
  canEdit: boolean;
  minutesUntilLock: number;
};

type Props = {
  groupId: string;
  robloxGroupId: string;
  currentUserRole: string | null;
  staffList: Array<{ robloxUserId: string; username: string }>;
  onClose: () => void;
};

export function ModerationLogModal({
  groupId,
  robloxGroupId,
  currentUserRole,
  staffList,
  onClose,
}: Props) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Log action form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [targetRobloxUserId, setTargetRobloxUserId] = useState("");
  const [actionType, setActionType] = useState("WARNING");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit action modal state
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editType, setEditType] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const canLogAction =
    currentUserRole === "OWNER" ||
    currentUserRole === "MANAGER" ||
    currentUserRole === "MODERATOR";

  const canExportCSV = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const fetchActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = typeFilter !== "ALL" ? `&type=${typeFilter}` : "";
      const res = await fetch(`/api/roster/actions?groupId=${groupId}${q}`);
      if (!res.ok) {
        throw new Error(`Failed to load actions (${res.status})`);
      }
      const data = await res.json();
      setActions(data.actions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load moderation actions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [groupId, typeFilter]);

  const handleExportCSV = () => {
    window.open(`/api/roster/actions?groupId=${groupId}&format=csv`, "_blank");
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRobloxUserId || !reason.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/roster/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          targetRobloxUserId,
          type: actionType,
          reason,
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to log action");
      }

      setShowLogForm(false);
      setReason("");
      setDurationMinutes("");
      fetchActions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction || !editReason.trim()) return;

    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch("/api/roster/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: editingAction.id,
          reason: editReason,
          type: editType,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update action");
      }

      setEditingAction(null);
      fetchActions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const getTargetName = (rId: string) => {
    const s = staffList.find((st) => st.robloxUserId === rId);
    return s?.username || `Roblox #${rId}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0d0e15] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Staff Moderation Log
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Workflow 4.5 &bull; 24-Hour Edit Window &bull; Full Audit Trail
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canExportCSV && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-violet-500/40 bg-white/5 hover:bg-violet-600/20 text-xs text-slate-200 hover:text-white inline-flex items-center gap-1.5 transition-colors font-mono"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#151722] text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value="ALL">All Types</option>
              <option value="WARNING">Warnings</option>
              <option value="SUSPENSION">Suspensions</option>
              <option value="REMOVAL">Removals</option>
              <option value="NOTE">Notes</option>
              <option value="COMMENDATION">Commendations</option>
            </select>
          </div>

          {/* New Action Trigger */}
          {canLogAction && !showLogForm && (
            <button
              type="button"
              onClick={() => {
                setShowLogForm(true);
                if (staffList.length > 0 && !targetRobloxUserId) {
                  setTargetRobloxUserId(staffList[0].robloxUserId);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold inline-flex items-center justify-center gap-1.5 shadow-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Action</span>
            </button>
          )}
        </div>

        {/* Log Action Form */}
        {showLogForm && (
          <form
            onSubmit={handleCreateAction}
            className="p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">Record Moderation Action</span>
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Target Staff Member
                </label>
                <select
                  value={targetRobloxUserId}
                  onChange={(e) => setTargetRobloxUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white focus:outline-none focus:border-violet-500"
                >
                  {staffList.map((st) => (
                    <option key={st.robloxUserId} value={st.robloxUserId}>
                      {st.username} ({st.robloxUserId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Action Type
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="WARNING">WARNING</option>
                  <option value="SUSPENSION">SUSPENSION</option>
                  <option value="REMOVAL">REMOVAL</option>
                  <option value="NOTE">NOTE</option>
                  <option value="COMMENDATION">COMMENDATION</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Duration (Mins, Optional)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="e.g. 1440 for 24h"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400 uppercase tracking-wider">
                Reason &amp; Documentation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detailed reason, timestamps, links to evidence..."
                required
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold transition-colors shadow-md"
              >
                {submitting ? "Logging..." : "Commit Action"}
              </button>
            </div>
          </form>
        )}

        {/* Actions List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading actions...</div>
        ) : actions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs italic">
            No moderation actions recorded for this group.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
            {actions.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        act.type === "REMOVAL"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : act.type === "SUSPENSION"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : act.type === "COMMENDATION"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {act.type}
                    </span>
                    <span className="font-bold text-white">
                      Target: {getTargetName(act.targetRobloxUserId)}
                    </span>
                    {act.durationMinutes && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({act.durationMinutes} mins)
                      </span>
                    )}
                  </div>

                  {/* Timestamp & Edit Control */}
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span>
                      {new Date(act.createdAt).toLocaleDateString()} by {act.actorUsername}
                    </span>
                    {act.editedAt && (
                      <span className="text-amber-400/80 italic">(edited)</span>
                    )}
                    {act.canEdit ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAction(act);
                          setEditReason(act.reason);
                          setEditType(act.type);
                        }}
                        className="text-violet-400 hover:text-white inline-flex items-center gap-1 font-sans"
                        title={`${act.minutesUntilLock} mins remaining in edit window`}
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <span className="text-slate-600" title="Locked after 24 hours">
                        Locked
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{act.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Edit Action Modal */}
        {editingAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
            <form
              onSubmit={handleSaveEdit}
              className="w-full max-w-lg bg-[#11131c] border border-white/20 rounded-2xl p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-sm text-white">Edit Action (24h Window)</span>
                <button
                  type="button"
                  onClick={() => setEditingAction(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
                >
                  <option value="WARNING">WARNING</option>
                  <option value="SUSPENSION">SUSPENSION</option>
                  <option value="REMOVAL">REMOVAL</option>
                  <option value="NOTE">NOTE</option>
                  <option value="COMMENDATION">COMMENDATION</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Reason &amp; Correction
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAction(null)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold"
                >
                  {savingEdit ? "Saving..." : "Save Correction"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
