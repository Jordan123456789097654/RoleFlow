"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  X,
  Plus,
  TrendingUp,
  Shield,
  AlertCircle,
  Users,
} from "lucide-react";

type Props = {
  groupId: string;
  teams: Array<{ id: string; name: string }>;
  staffList: Array<{ robloxUserId: string; username: string }>;
  currentUserRole: string | null;
  onClose: () => void;
};

export function TrainingAndShiftsModal({
  groupId,
  teams,
  staffList,
  currentUserRole,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"activity" | "training" | "shifts">("activity");
  const [activityDays, setActivityDays] = useState<7 | 30 | 90>(30);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [submittingTraining, setSubmittingTraining] = useState(false);

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftTeamId, setShiftTeamId] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [shiftAttendees, setShiftAttendees] = useState<string[]>([]);
  const [submittingShift, setSubmittingShift] = useState(false);

  const canManage = currentUserRole === "OWNER" || currentUserRole === "MANAGER";

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roster/shifts?groupId=${groupId}&view=activity&days=${activityDays}`);
      if (!res.ok) throw new Error("Failed to load activity summary");
      const data = await res.json();
      setActivityData(data.activity || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roster/training?groupId=${groupId}`);
      if (!res.ok) throw new Error("Failed to load training sessions");
      const data = await res.json();
      setTrainings(data.trainings || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/roster/shifts?groupId=${groupId}`);
      if (!res.ok) throw new Error("Failed to load shifts");
      const data = await res.json();
      setShifts(data.shifts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "activity") fetchActivity();
    if (tab === "training") fetchTrainings();
    if (tab === "shifts") fetchShifts();
  }, [tab, activityDays, groupId]);

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainingTitle || !trainingDate) return;
    setSubmittingTraining(true);
    try {
      const res = await fetch("/api/roster/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          title: trainingTitle,
          startsAt: trainingDate,
          attendeeRobloxUserIds: selectedAttendees,
        }),
      });
      if (!res.ok) throw new Error("Failed to create training session");
      setShowTrainingForm(false);
      setTrainingTitle("");
      setTrainingDate("");
      setSelectedAttendees([]);
      fetchTrainings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingTraining(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftStart || !shiftEnd) return;
    setSubmittingShift(true);
    try {
      const res = await fetch("/api/roster/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          teamId: shiftTeamId || null,
          startsAt: shiftStart,
          endsAt: shiftEnd,
          attendeeRobloxUserIds: shiftAttendees,
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule shift");
      setShowShiftForm(false);
      setShiftStart("");
      setShiftEnd("");
      setShiftAttendees([]);
      fetchShifts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingShift(false);
    }
  };

  const handleCloseShift = async (shiftId: string) => {
    try {
      const res = await fetch("/api/roster/shifts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId, closeShift: true }),
      });
      if (!res.ok) throw new Error("Failed to close shift");
      fetchShifts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0d0e15] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Shifts, Training &amp; Staff Activity
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Workflows 4.6 &amp; 4.7 &bull; Automated 7/30/90-Day Counts &bull; Zero Privacy Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setTab("activity")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
              tab === "activity"
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Activity Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("training")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
              tab === "training"
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Training Sessions</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("shifts")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
              tab === "shifts"
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Shifts Log</span>
          </button>
        </div>

        {/* TAB 1: Activity Overview */}
        {tab === "activity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Time Window:</span>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs font-mono">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActivityDays(d as any)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      activityDays === d
                        ? "bg-violet-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Computing activity...</div>
            ) : activityData.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs italic">
                No activity recorded in this period.
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                {activityData.map((staff, idx) => (
                  <div
                    key={staff.robloxUserId}
                    className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 text-xs w-4">#{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white">{staff.username}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Rank: {staff.rank}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div className="text-right">
                        <div className="font-bold text-white">{staff.shiftsCompleted}</div>
                        <div className="text-[10px] text-slate-500">Shifts</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{staff.trainingsCompleted}</div>
                        <div className="text-[10px] text-slate-500">Training</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{staff.actionsLoggedOrTargeted}</div>
                        <div className="text-[10px] text-slate-500">Actions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Training Sessions */}
        {tab === "training" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Training Checklists &amp; Sessions</span>
              {canManage && !showTrainingForm && (
                <button
                  type="button"
                  onClick={() => setShowTrainingForm(true)}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Session</span>
                </button>
              )}
            </div>

            {showTrainingForm && (
              <form
                onSubmit={handleCreateTraining}
                className="p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 space-y-3 text-xs"
              >
                <div className="font-bold text-sm text-white">New Training Session</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={trainingTitle}
                    onChange={(e) => setTrainingTitle(e.target.value)}
                    placeholder="Session Title (e.g. Moderator Orientation)"
                    required
                    className="px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
                  />
                  <input
                    type="datetime-local"
                    value={trainingDate}
                    onChange={(e) => setTrainingDate(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTrainingForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTraining}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold"
                  >
                    Save Training
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading training sessions...</div>
            ) : trainings.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs italic">
                No training sessions scheduled.
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                {trainings.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{t.title}</div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        Starts: {new Date(t.startsAt).toLocaleString()} &bull; Attendees: {t.attendeesCount}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        t.completedAt
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {t.completedAt ? "Closed & Recorded" : "In Progress"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Shifts Log */}
        {tab === "shifts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Scheduled &amp; Completed Shifts</span>
              {canManage && !showShiftForm && (
                <button
                  type="button"
                  onClick={() => setShowShiftForm(true)}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Shift</span>
                </button>
              )}
            </div>

            {showShiftForm && (
              <form
                onSubmit={handleCreateShift}
                className="p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 space-y-3 text-xs"
              >
                <div className="font-bold text-sm text-white">Schedule Activity Shift</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Start Time</label>
                    <input
                      type="datetime-local"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">End Time</label>
                    <input
                      type="datetime-local"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Team (Optional)</label>
                  <select
                    value={shiftTeamId}
                    onChange={(e) => setShiftTeamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white"
                  >
                    <option value="">All Teams / General</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowShiftForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingShift}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold"
                  >
                    Schedule Shift
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading shifts...</div>
            ) : shifts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs italic">
                No shifts scheduled or logged.
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                {shifts.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {new Date(s.startsAt).toLocaleDateString()} Shift ({s.attendeesCount} staff)
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        {new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {new Date(s.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.closedAt ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Closed
                        </span>
                      ) : (
                        canManage && (
                          <button
                            type="button"
                            onClick={() => handleCloseShift(s.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]"
                          >
                            Close Shift
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
