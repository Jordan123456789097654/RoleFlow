"use client";

import React, { useState } from "react";
import { Shield, Sparkles, Plus, Users, ArrowRight, Check, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

export function RosterGroupConnectManager() {
  const [groupIdInput, setGroupIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    groupName: string;
    memberCount: number;
    rolesCount: number;
    previewMembersCount: number;
    roles: Array<{ id: number; name: string; rank: number }>;
    members: Array<{ userId: number; username: string; rank: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupIdInput.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/roster/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxGroupId: groupIdInput.trim(), confirm: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data);
      } else {
        setError(data.error || "Failed to inspect Roblox group.");
      }
    } catch {
      setError("Network error while inspecting group.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/roster/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxGroupId: groupIdInput.trim(), confirm: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Group "${preview?.groupName}" connected successfully to Roster!`);
        setPreview(null);
        setGroupIdInput("");
      } else {
        setError(data.error || "Failed to connect group.");
      }
    } catch {
      setError("Network error while committing group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-white/10 bg-[#0c0d14] p-6 text-left space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Connect a Roblox Group</h3>
            <p className="text-xs text-slate-400">Workflow 4.1: Inspect, verify management rank, and confirm import.</p>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
          Stage 3 Live
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 flex items-start gap-2">
          <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handlePreview} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Roblox Group ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. 12345678"
              value={groupIdInput}
              onChange={(e) => setGroupIdInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Inspecting..." : "Inspect Group"}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Roster connects via official Roblox APIs. Your linked account must have Manager (Rank &ge; 200) or Owner authority.
          </p>
        </div>
      </form>

      {/* Confirmation Step (No changes committed until button click) */}
      {preview && (
        <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-950/20 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-violet-400">Step 2: Confirm Roster Import</span>
              <h4 className="text-base font-bold text-white mt-0.5">{preview.groupName}</h4>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              <span>{preview.memberCount.toLocaleString()} Members</span> &bull; <span>{preview.rolesCount} Ranks</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            We verified your management authority in this group. Confirming will import initial members and establish your Roster owner cockpit.
          </p>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400">Sample Members to be Imported:</span>
            <div className="flex flex-wrap gap-1.5">
              {preview.members.map((m) => (
                <span
                  key={m.userId}
                  className="px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 text-[11px] font-mono text-slate-300"
                >
                  {m.username} ({m.rank})
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-card shadow-violet-600/30 hover:bg-violet-500 transition-colors flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirm &amp; Import to Roster</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
