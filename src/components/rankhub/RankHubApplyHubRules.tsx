"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Zap,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Bell,
} from "lucide-react";
import type { ApplyHubRule, RankLadderRole } from "@/lib/rankhub-types";

interface RankHubApplyHubRulesProps {
  availableRoles: RankLadderRole[];
  rankCeiling: number;
}

export function RankHubApplyHubRules({
  availableRoles,
  rankCeiling,
}: RankHubApplyHubRulesProps) {
  const [rules, setRules] = useState<ApplyHubRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form to add new rule
  const [formName, setFormName] = useState("");
  const [targetRank, setTargetRank] = useState<number>(40);
  const [autoPromote, setAutoPromote] = useState(true);
  const [discordNotify, setDiscordNotify] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/rankhub/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);

    try {
      const targetRole = availableRoles.find((r) => r.rank === targetRank);

      const res = await fetch("/api/rankhub/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName: formName.trim(),
          targetRoleId: targetRole?.id || 7005,
          targetRoleName: targetRole?.name || `Rank ${targetRank}`,
          targetRank,
          autoPromote,
          discordNotify,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules([data.rule, ...rules]);
        setFormName("");
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch(`/api/rankhub/rules?id=${id}`, { method: "DELETE" });
      setRules(rules.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090b10] p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-white">ApplyHub &rarr; RankHub Automation</h2>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-violet-300 border border-violet-500/20">
              Cross-App Pipeline
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Automatically promote candidates on Roblox the moment their ApplyHub application reaches quorum or gets approved by community staff.
          </p>
        </div>

        <a
          href="https://applyhub.roleflow.site"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>Open ApplyHub Forms</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Add New Rule Form */}
      <form onSubmit={handleCreateRule} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="block text-[11px] font-medium text-slate-400">Application Template</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Senior Staff Application"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-violet-500/60"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400">Target Roblox Rank</label>
          <select
            value={targetRank}
            onChange={(e) => setTargetRank(Number(e.target.value))}
            aria-label="Target Roblox Rank"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-violet-500/60"
          >
            {availableRoles.map((r) => (
              <option key={r.rank} value={r.rank} className="bg-slate-900 text-white">
                Rank {r.rank} - {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoPromote}
              onChange={(e) => setAutoPromote(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-0"
            />
            <span>Instant Rank</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={discordNotify}
              onChange={(e) => setDiscordNotify(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-violet-600 focus:ring-0"
            />
            <span>Discord DM</span>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect Pipeline</span>
          </button>
        </div>
      </form>

      {/* Rules list */}
      <div className="mt-5 space-y-2.5">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{rule.formName}</span>
                  {rule.autoPromote && (
                    <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      <Zap className="h-3 w-3" />
                      Auto-Rank Active
                    </span>
                  )}
                  {rule.discordNotify && (
                    <span className="flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
                      <Bell className="h-3 w-3" />
                      DM Notification
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>On Approved Submission</span>
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <span className="font-semibold text-violet-300">
                    Rank {rule.targetRank} ({rule.targetRoleName})
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">{rule.passedCount} applicants promoted to date</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleDeleteRule(rule.id)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {rules.length === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
            No active ApplyHub automation rules. Create one above to link recruitment to Roblox group roles.
          </div>
        )}
      </div>
    </div>
  );
}
