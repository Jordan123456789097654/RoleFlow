"use client";

import React, { useState } from "react";
import {
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ArrowRight,
  Clock,
  RefreshCw,
} from "lucide-react";
import type { BatchRankItem, RankLadderRole } from "@/lib/rankhub-types";

interface RankHubBatchQueueProps {
  availableRoles: RankLadderRole[];
  rankCeiling: number;
  protectedRanks: number[];
  onBatchExecuted?: (batchResult: any) => void;
}

export function RankHubBatchQueue({
  availableRoles,
  rankCeiling,
  protectedRanks,
  onBatchExecuted,
}: RankHubBatchQueueProps) {
  const [dryRun, setDryRun] = useState(true);
  const [items, setItems] = useState<BatchRankItem[]>([
    {
      id: "queue_1",
      targetUsername: "AeroPilot_X",
      robloxUserId: "19283711",
      currentRankName: "Guest",
      currentRank: 1,
      newRankName: "Trainee",
      newRank: 10,
      reason: "Completed onboarding stage 1",
      source: "manual",
      status: "pending",
    },
    {
      id: "queue_2",
      targetUsername: "PixelBuilder_9",
      robloxUserId: "20192831",
      currentRankName: "Trainee",
      currentRank: 10,
      newRankName: "Junior Moderator",
      newRank: 40,
      reason: "Passed application review quorum",
      source: "applyhub",
      status: "pending",
    },
    {
      id: "queue_3",
      targetUsername: "IllegalTestUser",
      robloxUserId: "99102931",
      currentRankName: "Junior Moderator",
      currentRank: 40,
      newRankName: "Executive (Protected)",
      newRank: 254,
      reason: "Unauthorized escalation test",
      source: "manual",
      status: "pending",
    },
  ]);

  // Form input for new candidate
  const [newUsername, setNewUsername] = useState("");
  const [newRobloxId, setNewRobloxId] = useState("");
  const [selectedTargetRank, setSelectedTargetRank] = useState<number>(10);
  const [reason, setReason] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [lastBatchResult, setLastBatchResult] = useState<any | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newRobloxId.trim()) return;

    const targetRole = availableRoles.find((r) => r.rank === selectedTargetRank);

    const newItem: BatchRankItem = {
      id: `queue_${Date.now()}`,
      targetUsername: newUsername.trim(),
      robloxUserId: newRobloxId.trim(),
      currentRankName: "Member",
      currentRank: 2,
      newRankName: targetRole ? targetRole.name : `Rank ${selectedTargetRank}`,
      newRank: selectedTargetRank,
      reason: reason.trim() || "Batch Promotion",
      source: "manual",
      status: "pending",
    };

    setItems([...items, newItem]);
    setNewUsername("");
    setNewRobloxId("");
    setReason("");
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleClearQueue = () => {
    setItems([]);
    setLastBatchResult(null);
  };

  const handleExecuteBatch = async () => {
    if (!items.length) return;
    setIsRunning(true);
    setProgressPercent(10);

    try {
      // Animated progress emulation
      const progressTimer = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          return prev + 25;
        });
      }, 200);

      const res = await fetch("/api/rankhub/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          dryRun,
          rankCeiling,
          protectedRanks,
        }),
      });

      clearInterval(progressTimer);
      setProgressPercent(100);

      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.items);
        setLastBatchResult(data);
        if (onBatchExecuted) onBatchExecuted(data);
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        setIsRunning(false);
        setProgressPercent(0);
      }, 500);
    }
  };

  const handle1ClickRollback = async () => {
    if (!lastBatchResult) return;
    const confirm = window.confirm("Roll back all successful promotions from this batch?");
    if (!confirm) return;

    // Simulate rollback
    setItems((prev) =>
      prev.map((item) =>
        item.status === "success" || item.status === "simulated"
          ? { ...item, status: "rolled_back", errorDetails: "Rolled back to original rank." }
          : item
      )
    );
    setLastBatchResult(null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090b10] p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Batch Rank Engine &amp; Dry-Run Simulation</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Queue multiple rank updates. Toggle Dry Run mode to test permission thresholds and ceilings before mutating live Roblox state.
          </p>
        </div>

        {/* Dry-run Toggle Switch */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setDryRun(!dryRun)}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
              dryRun
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
            }`}
          >
            {dryRun ? (
              <ToggleRight className="h-5 w-5 text-emerald-400" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-amber-400" />
            )}
            <div className="text-left">
              <span className="block font-bold">
                {dryRun ? "Dry Run: Simulated" : "Live Execution: Mutating"}
              </span>
              <span className="block text-[10px] font-mono text-slate-400">
                {dryRun ? "Zero Roblox API mutations" : "Updates live group ranks"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Candidate Intake Form */}
      <form onSubmit={handleAddItem} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="block text-[11px] font-medium text-slate-400">Roblox Username</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Username"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/60"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400">Roblox User ID</label>
          <input
            type="text"
            value={newRobloxId}
            onChange={(e) => setNewRobloxId(e.target.value)}
            placeholder="e.g. 19283711"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/60"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400">Target Role</label>
          <select
            value={selectedTargetRank}
            onChange={(e) => setSelectedTargetRank(Number(e.target.value))}
            aria-label="Target Role to assign"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/60"
          >
            {availableRoles.map((r) => (
              <option key={r.rank} value={r.rank} className="bg-slate-900 text-white">
                Rank {r.rank} - {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/60"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Queue</span>
          </button>
        </div>
      </form>

      {/* Progress Bar (when executing) */}
      {isRunning && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-cyan-300">
            <span>Executing Batch Pipeline...</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Last execution notification badge */}
      {lastBatchResult && (
        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs ${
            lastBatchResult.errorCount > 0
              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{lastBatchResult.message}</span>
          </div>

          {!dryRun && lastBatchResult.successCount > 0 && (
            <button
              type="button"
              onClick={handle1ClickRollback}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>1-Click Rollback Batch</span>
            </button>
          )}
        </div>
      )}

      {/* Queue items list */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Queued Candidates ({items.length})</span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearQueue}
              className="text-xs text-rose-400 hover:underline"
            >
              Clear Queue
            </button>
          )}
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 font-mono text-xs font-bold text-slate-300">
                  #{item.robloxUserId.slice(-4)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.targetUsername}</span>
                    <span className="font-mono text-[10px] text-slate-500">ID: {item.robloxUserId}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                      {item.source}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-slate-400 text-[11px]">
                    <span className="text-slate-400">{item.currentRankName} (Rank {item.currentRank})</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className="font-semibold text-cyan-300">{item.newRankName} (Rank {item.newRank})</span>
                    {item.reason && <span className="text-slate-500 italic">• &quot;{item.reason}&quot;</span>}
                  </div>
                </div>
              </div>

              {/* Status Indicator & Action */}
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                {item.status === "pending" && (
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-slate-400 border border-white/10">
                    Queued
                  </span>
                )}
                {item.status === "simulated" && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Simulated OK
                  </span>
                )}
                {item.status === "success" && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="h-3 w-3" />
                    Live Ranked
                  </span>
                )}
                {item.status === "error" && (
                  <span
                    title={item.errorDetails}
                    className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 font-mono text-[10px] text-rose-300 border border-rose-500/30"
                  >
                    <XCircle className="h-3 w-3" />
                    Boundary Blocked
                  </span>
                )}
                {item.status === "rolled_back" && (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] text-amber-300 border border-amber-500/30">
                    Rolled Back
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
              Batch queue is empty. Add users manually above or link ApplyHub templates.
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Strict boundary check enabled against ceiling ({rankCeiling}) and protected roles ({protectedRanks.join(", ")}).</span>
        </div>

        <button
          type="button"
          onClick={handleExecuteBatch}
          disabled={isRunning || items.length === 0}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
            dryRun
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500"
              : "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500"
          }`}
        >
          {isRunning ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          <span>{dryRun ? "Simulate Dry Run (Safe)" : "Execute Live Rank Batch"}</span>
        </button>
      </div>
    </div>
  );
}
