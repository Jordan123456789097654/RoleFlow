"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  RotateCcw,
  CheckCircle2,
  KeyRound,
  Cookie,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock,
  Layers,
} from "lucide-react";
import type { AuditLogItem } from "@/lib/rankhub-types";

export function RankHubAuditLog() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/rankhub/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (log: AuditLogItem) => {
    const confirm = window.confirm(
      `Roll back rank update for ${log.targetUser}? This will demote/promote them back to Rank ${log.fromRank} (${log.fromRankName}).`
    );
    if (!confirm) return;

    setRollingBackId(log.id);
    try {
      const res = await fetch("/api/rankhub/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", logId: log.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification(data.message);
        fetchLogs();
      } else {
        alert(data.error || "Rollback failed");
      }
    } catch {
      alert("Network error executing rollback");
    } finally {
      setRollingBackId(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === "ALL") return true;
    return log.action === filterAction;
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090b10] p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <History className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Immutable Rank Audit Log</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time feed of all automated &amp; manual Roblox role modifications with 1-click instantaneous rollback capability.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            aria-label="Filter Audit Logs by Action"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Actions</option>
            <option value="BATCH_RANK">Batch Promotions</option>
            <option value="APPLYHUB_AUTO">ApplyHub Automated</option>
            <option value="PROMOTE">Manual Promotions</option>
            <option value="DEMOTE">Demotions</option>
            <option value="ROLLBACK">Rollbacks</option>
          </select>

          <button
            type="button"
            onClick={fetchLogs}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {notification && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[11px] text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Audit Log Table / Feed */}
      <div className="mt-5 space-y-2.5">
        {filteredLogs.map((log) => {
          let actionBadge = "bg-white/5 text-slate-300 border-white/10";
          if (log.action === "PROMOTE" || log.action === "BATCH_RANK") {
            actionBadge = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
          } else if (log.action === "DEMOTE") {
            actionBadge = "bg-rose-500/10 text-rose-300 border-rose-500/20";
          } else if (log.action === "APPLYHUB_AUTO") {
            actionBadge = "bg-violet-500/10 text-violet-300 border-violet-500/20";
          } else if (log.action === "ROLLBACK") {
            actionBadge = "bg-amber-500/10 text-amber-300 border-amber-500/20";
          }

          return (
            <div
              key={log.id}
              className={`flex flex-col gap-3 rounded-xl border p-3.5 text-xs transition-colors sm:flex-row sm:items-center sm:justify-between ${
                log.isRolledBack
                  ? "border-amber-500/30 bg-amber-500/[0.02] opacity-75"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 font-mono text-xs font-bold text-slate-300">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{log.targetUser}</span>
                    <span className="font-mono text-[10px] text-slate-500">ID: {log.robloxUserId}</span>
                    <span className={`rounded-full border px-2 py-0.2 font-mono text-[9px] uppercase ${actionBadge}`}>
                      {log.action}
                    </span>
                    <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      {log.method}
                    </span>
                    {log.isRolledBack && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                        Rolled Back
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[11px]">
                    <span className="text-slate-400">
                      {log.fromRankName} (Rank {log.fromRank})
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className="font-semibold text-emerald-300">
                      {log.toRankName} (Rank {log.toRank})
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">By {log.actor}</span>
                    {log.reason && <span>• &quot;{log.reason}&quot;</span>}
                  </div>
                </div>
              </div>

              {/* Timestamp & Rollback Trigger */}
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                {log.canRollback && !log.isRolledBack && (
                  <button
                    type="button"
                    onClick={() => handleRollback(log)}
                    disabled={rollingBackId === log.id}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{rollingBackId === log.id ? "Rolling back..." : "Rollback"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
            No audit records found matching your selection.
          </div>
        )}
      </div>
    </div>
  );
}
