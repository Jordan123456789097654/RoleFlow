"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Clock,
  BookOpen,
  AlertTriangle,
  FileText,
  Calendar,
  Save,
  CheckCircle2,
  ExternalLink,
  Lock,
} from "lucide-react";

type StaffDetail = {
  id: string;
  groupId: string;
  robloxUserId: string;
  username: string;
  avatarUrl: string;
  rank: string;
  role: string;
  status: string;
  notes: string | null;
  joinedAt: string;
  updatedAt: string;
  sourceApplicationId: string | null;
  teams: Array<{ id: string; name: string }>;
};

type HistoryData = {
  actions: Array<{
    id: string;
    type: string;
    reason: string;
    durationMinutes: number | null;
    actorUsername: string;
    createdAt: string;
    editedAt: string | null;
  }>;
  trainings: Array<{
    id: string;
    title: string;
    startsAt: string;
    completedAt: string | null;
    completed: boolean;
  }>;
  shifts: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    closedAt: string | null;
  }>;
};

type Props = {
  groupId: string;
  robloxUserId: string;
  availableTeams: Array<{ id: string; name: string }>;
  onClose: () => void;
  onStaffUpdated?: () => void;
};

export function StaffRecordModal({
  groupId,
  robloxUserId,
  availableTeams,
  onClose,
  onStaffUpdated,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isTargetSelf, setIsTargetSelf] = useState(false);

  // Editable fields
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");
  const [role, setRole] = useState("STAFF");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadStaffRecord() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/roster/staff/${robloxUserId}?groupId=${groupId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to fetch staff record (${res.status})`);
        }
        const data = await res.json();
        setStaff(data.staff);
        setHistory(data.history);
        setCanEdit(data.capabilities.canEdit);
        setIsTargetSelf(data.capabilities.isTargetSelf);

        setStatus(data.staff.status);
        setNotes(data.staff.notes || "");
        setRole(data.staff.role);
        setSelectedTeamIds(data.staff.teams.map((t: any) => t.id));
      } catch (err: any) {
        setError(err.message || "Failed to load staff record");
      } finally {
        setLoading(false);
      }
    }

    loadStaffRecord();
  }, [groupId, robloxUserId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await fetch(`/api/roster/staff/${robloxUserId}?groupId=${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          role,
          teamIds: selectedTeamIds,
        }),
      });

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Failed to update staff record");
      }

      setSaveSuccess(true);
      if (onStaffUpdated) onStaffUpdated();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    if (!canEdit) return;
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0d0e15] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Staff Dossier {isTargetSelf && "(Your Record)"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading staff record...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs">
            {error}
          </div>
        ) : staff ? (
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <img
                src={staff.avatarUrl}
                alt={staff.username}
                className="w-16 h-16 rounded-full border border-violet-500/30 object-cover bg-black/40"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-white truncate">{staff.username}</h3>
                  <a
                    href={`https://www.roblox.com/users/${staff.robloxUserId}/profile`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-mono"
                  >
                    <span>Roblox #{staff.robloxUserId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                  <span className="font-semibold text-slate-200">Rank: {staff.rank}</span>
                  <span className="text-white/20">&bull;</span>
                  <span className="text-slate-400 font-mono">
                    Joined: {new Date(staff.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Fields for Manager/Owner, Read-Only for Staff */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Platform Role
                  </label>
                  {canEdit ? (
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="STAFF">STAFF (Self-View Only)</option>
                      <option value="MODERATOR">MODERATOR (View Roster &amp; Log Actions)</option>
                      <option value="MANAGER">MANAGER (Full Roster &amp; Operational Control)</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-slate-300 font-mono">
                      {role}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Staff Status
                  </label>
                  {canEdit ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ON_LEAVE">ON LEAVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  ) : (
                    <div className="px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-slate-300 font-mono">
                      {status}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Assignments */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Teams
                </label>
                {availableTeams.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No teams configured in this group.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTeams.map((t) => {
                      const selected = selectedTeamIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => toggleTeam(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selected
                              ? "bg-violet-600/30 border-violet-500/60 text-white"
                              : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                          } ${!canEdit ? "cursor-default" : ""}`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confidential Manager Notes */}
              {canEdit ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Manager Notes (Confidential &bull; Invisible to Staff)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal observations, performance reviews, or background flags..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#151722] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              ) : null}

              {/* Save Button for Managers */}
              {canEdit && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Saved successfully
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors shadow-lg"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? "Saving..." : "Save Staff Record"}</span>
                  </button>
                </div>
              )}
            </form>

            {/* History Tabs / Sections */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              {/* Training History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <span>Training History ({history?.trainings.length || 0})</span>
                </h4>
                {history?.trainings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No recorded training sessions.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {history?.trainings.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/[0.01] text-xs"
                      >
                        <span className="text-slate-200 font-medium">{t.title}</span>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                          <span>{new Date(t.startsAt).toLocaleDateString()}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              t.completed
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {t.completed ? "Completed" : "Attended"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Moderation Actions History */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-indigo-400" />
                  <span>Moderation Actions Log ({history?.actions.length || 0})</span>
                </h4>
                {history?.actions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No moderation actions recorded.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {history?.actions.map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-lg border border-white/5 bg-white/[0.01] space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-mono font-bold text-white uppercase text-[11px]">
                            {a.type}
                          </span>
                          <span className="font-mono text-[11px]">
                            {new Date(a.createdAt).toLocaleDateString()} by {a.actorUsername}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{a.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
