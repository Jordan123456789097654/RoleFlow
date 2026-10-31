"use client";

import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X,
  Sparkles,
} from "lucide-react";

export interface RankConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  targetRobloxId: string;
  targetRobloxUsername: string;
  action: "PROMOTE" | "DEMOTE";
  currentRankName: string;
  currentRankId: number;
  availableRoles: Array<{ id: number; name: string; rank: number }>;
  rankCeiling?: number;
  protectedRoles?: Array<number | string>;
  onSuccess: (updated: { newRankId: number; newRankName: string }) => void;
}

export function RankConfirmationModal({
  isOpen,
  onClose,
  groupId,
  targetRobloxId,
  targetRobloxUsername,
  action,
  currentRankName,
  currentRankId,
  availableRoles,
  rankCeiling = 254,
  protectedRoles = [],
  onSuccess,
}: RankConfirmationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sort valid roles ascending by rank
  const sortedRoles = [...availableRoles]
    .filter((r) => r.rank > 0)
    .sort((a, b) => a.rank - b.rank);

  let nextRole: { id: number; name: string; rank: number } | undefined;

  if (action === "PROMOTE") {
    const higherRoles = sortedRoles.filter((r) => r.rank > currentRankId);
    nextRole = higherRoles[0];
  } else {
    const lowerRoles = sortedRoles.filter((r) => r.rank < currentRankId);
    nextRole = lowerRoles[lowerRoles.length - 1];
  }

  // Safety checks
  const isCeilingBreached = nextRole ? nextRole.rank > rankCeiling : false;
  const isCurrentAboveCeiling = currentRankId > rankCeiling;
  const protectedList = protectedRoles.map((x) => String(x).trim());
  const isTargetProtected = nextRole
    ? protectedList.includes(String(nextRole.rank)) || protectedList.includes(String(nextRole.id))
    : false;
  const isCurrentProtected =
    protectedList.includes(String(currentRankId));

  const hasSafetyWarning = isCeilingBreached || isCurrentAboveCeiling || isTargetProtected || isCurrentProtected;

  const handleConfirm = async () => {
    if (!nextRole) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/roster/rank-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          targetRobloxId,
          targetRobloxUsername,
          action,
          targetRankId: nextRole.rank,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 423) {
          throw new Error("Ranking operations are LOCKED by Anti-Nuke security. Contact group administrator.");
        }
        throw new Error(data.error || `Ranking failed (${res.status})`);
      }

      onSuccess({
        newRankId: data.member?.newRankId ?? nextRole.rank,
        newRankName: data.member?.newRankName ?? nextRole.name,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0e1017] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                action === "PROMOTE"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {action === "PROMOTE" ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {action === "PROMOTE" ? "Promote Staff Member" : "Demote Staff Member"}
              </h3>
              <p className="text-xs text-slate-400">Target: @{targetRobloxUsername}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rank Transition Details */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Rank Transition
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-500 block">Current Rank</span>
              <span className="font-semibold text-white font-mono">
                {currentRankName} <span className="text-slate-500">({currentRankId})</span>
              </span>
            </div>

            <div className="text-slate-500 font-mono text-base px-2">&rarr;</div>

            <div className="space-y-0.5 text-right">
              <span className="text-[11px] text-slate-500 block">Next Rank</span>
              {nextRole ? (
                <span
                  className={`font-semibold font-mono ${
                    action === "PROMOTE" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {nextRole.name} <span className="text-slate-400">({nextRole.rank})</span>
                </span>
              ) : (
                <span className="text-slate-400 text-xs italic">
                  {action === "PROMOTE" ? "Maximum Rank" : "Lowest Rank"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Safety Warnings if applicable */}
        {hasSafetyWarning && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Safety Guard Warning</span>
              {isCeilingBreached && (
                <p>
                  Target rank ({nextRole?.rank}) exceeds the configured Rank Ceiling ({rankCeiling}).
                </p>
              )}
              {isCurrentAboveCeiling && (
                <p>
                  Member currently holds rank ({currentRankId}) which exceeds the Rank Ceiling ({rankCeiling}).
                </p>
              )}
              {(isTargetProtected || isCurrentProtected) && (
                <p>One or more roles in this transition are marked as Protected Roles.</p>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !nextRole || isCeilingBreached || isTargetProtected}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all inline-flex items-center gap-1.5 shadow-lg ${
              action === "PROMOTE"
                ? "bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
                : "bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none"
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating Roblox...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confirm {action === "PROMOTE" ? "Promotion" : "Demotion"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
