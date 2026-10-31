"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Briefcase,
} from "lucide-react";

type AcceptedApplicant = {
  applicationId: string;
  applicantUserId: string;
  robloxUserId: string;
  username: string;
  positionTitle: string;
  department: string | null;
  acceptedAt: string;
  alreadyStaff: boolean;
};

type Props = {
  groupId: string;
  availableTeams: Array<{ id: string; name: string }>;
  availableRanks: string[];
  onClose: () => void;
  onImportComplete?: () => void;
};

export function AcceptedApplicantsModal({
  groupId,
  availableTeams,
  availableRanks,
  onClose,
  onImportComplete,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<AcceptedApplicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<AcceptedApplicant | null>(null);

  // Form fields for confirming import
  const [customRank, setCustomRank] = useState("");
  const [customRole, setCustomRole] = useState("STAFF");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccepted() {
      setLoading(true);
      setError(null);
      try {
        // Step 1: Mint token from manager session
        const tokenRes = await fetch(`/api/roster/applications/import?groupId=${groupId}`);
        if (!tokenRes.ok) {
          throw new Error("Unable to mint authorized session token for ApplyHub");
        }
        const { token } = await tokenRes.json();

        // Step 2: Query accepted applications with signed token
        const appsRes = await fetch(
          `/api/roster/applications/accepted?groupId=${groupId}&token=${encodeURIComponent(token)}`
        );
        if (!appsRes.ok) {
          if (appsRes.status === 503) {
            throw new Error("ApplyHub is currently under scheduled maintenance (503).");
          }
          throw new Error(`Failed to query accepted applications (${appsRes.status})`);
        }
        const data = await appsRes.json();
        setApplicants(data.applications || []);
      } catch (err: any) {
        setError(err.message || "Failed to load accepted applicants");
      } finally {
        setLoading(false);
      }
    }

    fetchAccepted();
  }, [groupId]);

  const handleSelect = (app: AcceptedApplicant) => {
    setSelectedApplicant(app);
    setCustomRank(app.positionTitle || availableRanks[0] || "Moderator");
    setCustomRole("STAFF");
    setSelectedTeamIds([]);
    setNotes(`Imported from ApplyHub application for position: ${app.positionTitle}`);
  };

  const handleConfirmImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    setImporting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/roster/applications/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          applicationId: selectedApplicant.applicationId,
          robloxUserId: selectedApplicant.robloxUserId,
          username: selectedApplicant.username,
          rank: customRank,
          role: customRole,
          teamIds: selectedTeamIds,
          notes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to import staff record");
      }

      setSuccessMsg(`Successfully imported ${selectedApplicant.username} as a staff record!`);
      // Update local state
      setApplicants((prev) =>
        prev.map((a) =>
          a.applicationId === selectedApplicant.applicationId ? { ...a, alreadyStaff: true } : a
        )
      );
      setSelectedApplicant(null);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const toggleTeam = (teamId: string) => {
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
            <FileCheck className="w-5 h-5 text-violet-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Import Accepted ApplyHub Applicants
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Workflow 4.4 &bull; One-Click Staff Record Conversion
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

        {successMsg && (
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Fetching accepted applicants from ApplyHub...
          </div>
        ) : selectedApplicant ? (
          /* Confirmation & Field Selection Form */
          <form onSubmit={handleConfirmImport} className="space-y-4">
            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">
                  Converting: {selectedApplicant.username}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedApplicant(null)}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Change Selection
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Roblox User ID: <span className="font-mono text-slate-200">{selectedApplicant.robloxUserId || "Not Linked"}</span> &bull; Accepted for: <strong className="text-white">{selectedApplicant.positionTitle}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Rank */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Rank
                </label>
                <input
                  type="text"
                  value={customRank}
                  onChange={(e) => setCustomRank(e.target.value)}
                  placeholder="e.g. Moderator"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 uppercase tracking-wider">
                  Platform Role
                </label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-[#151722] text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="STAFF">STAFF (Read-only own record)</option>
                  <option value="MODERATOR">MODERATOR (View roster &amp; log actions)</option>
                  <option value="MANAGER">MANAGER (Full control)</option>
                </select>
              </div>
            </div>

            {/* Team selection */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-400 uppercase tracking-wider">
                Assign Teams
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {availableTeams.length === 0 ? (
                  <span className="text-slate-500 italic text-[11px]">No teams available</span>
                ) : (
                  availableTeams.map((t) => {
                    const sel = selectedTeamIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeam(t.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          sel
                            ? "bg-violet-600/30 border-violet-500/60 text-white"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-400 uppercase tracking-wider">
                Initial Manager Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#151722] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing || !selectedApplicant.robloxUserId}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{importing ? "Creating Record..." : "Confirm & Create Staff Record"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Applicant List */
          <div className="space-y-3">
            {applicants.length === 0 ? (
              <div className="p-8 text-center space-y-2 border border-white/5 rounded-2xl bg-white/[0.01]">
                <FileCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="font-bold text-sm text-white">No pending accepted applicants</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When applicants are accepted on ApplyHub for this Roblox group, they will appear here for 1-click staff onboarding.
                </p>
              </div>
            ) : (
              applicants.map((app) => (
                <div
                  key={app.applicationId}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4 hover:border-violet-500/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{app.username}</span>
                      {app.alreadyStaff && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Already Staff
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Position: <strong className="text-slate-200">{app.positionTitle}</strong> &bull; Accepted: {new Date(app.acceptedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={app.alreadyStaff || !app.robloxUserId}
                    onClick={() => handleSelect(app)}
                    className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors flex-shrink-0"
                  >
                    <span>{app.alreadyStaff ? "Imported" : "Import to Staff"}</span>
                    {!app.alreadyStaff && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
