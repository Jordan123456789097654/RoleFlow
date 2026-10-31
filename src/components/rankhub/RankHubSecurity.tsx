"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  BellRing,
  Activity,
  CheckCircle2,
  RefreshCw,
  Zap,
} from "lucide-react";

interface SecurityConfig {
  id?: string;
  groupId: string;
  antiNukeEnabled: boolean;
  maxDemotionsPerMinute: number;
  lockOnBreach: boolean;
  notifyWebhookUrl?: string | null;
  status: "NORMAL" | "LOCKED";
  lockedAt?: string | null;
  lockedReason?: string | null;
}

export function RankHubSecurity({ groupId = "15982012" }: { groupId?: string }) {
  const [config, setConfig] = useState<SecurityConfig>({
    groupId,
    antiNukeEnabled: true,
    maxDemotionsPerMinute: 3,
    lockOnBreach: true,
    notifyWebhookUrl: "",
    status: "NORMAL",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityConfig();
  }, [groupId]);

  const fetchSecurityConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rankhub/security?groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/rankhub/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          antiNukeEnabled: config.antiNukeEnabled,
          maxDemotionsPerMinute: config.maxDemotionsPerMinute,
          lockOnBreach: config.lockOnBreach,
          notifyWebhookUrl: config.notifyWebhookUrl,
        }),
      });
      if (res.ok) {
        setFeedback("Security settings saved successfully.");
      }
    } catch (err: any) {
      alert(`Error saving security config: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlock = async () => {
    setIsTogglingLock(true);
    try {
      const res = await fetch("/api/rankhub/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock",
          groupId,
        }),
      });
      if (res.ok) {
        setConfig((prev) => ({ ...prev, status: "NORMAL", lockedAt: null, lockedReason: null }));
        setFeedback("RankHub security unlocked! Live ranking operations restored.");
      }
    } catch (err: any) {
      alert(`Unlock failed: ${err?.message}`);
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleSimulateLockdown = async () => {
    setIsTogglingLock(true);
    try {
      const res = await fetch("/api/rankhub/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lockdown",
          groupId,
          reason: "Manual Emergency Drill / Rogues detected in group audit",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({
          ...prev,
          status: "LOCKED",
          lockedAt: new Date().toISOString(),
          lockedReason: "Manual Emergency Drill / Rogues detected in group audit",
        }));
      }
    } catch (err: any) {
      alert(`Lockdown failed: ${err?.message}`);
    } finally {
      setIsTogglingLock(false);
    }
  };

  const isLocked = config.status === "LOCKED";

  return (
    <div className="space-y-6">
      {/* Live Protection Status Card */}
      <div
        className={`rounded-2xl border p-6 transition-all ${
          isLocked
            ? "border-red-500/50 bg-red-950/30 text-white shadow-xl shadow-red-500/10"
            : "border-emerald-500/30 bg-emerald-950/20 text-white shadow-xl shadow-emerald-500/5"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`rounded-2xl p-3 ${
                isLocked
                  ? "border border-red-500/50 bg-red-500/20 text-red-400 animate-pulse"
                  : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
              }`}
            >
              {isLocked ? <ShieldAlert className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  Real-time Anti-Nuke Sentinel
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                    isLocked ? "bg-red-500/20 text-red-300 border border-red-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {isLocked ? "🚨 LOCKED WITH BREACH ALERT" : "● NORMAL - ARMED & ACTIVE"}
                </span>
              </div>

              <h2 className="mt-1 text-xl font-bold text-white">
                {isLocked ? "Ranking Pipeline Locked" : "Anti-Rogue & Anti-Nuke Protection Active"}
              </h2>

              <p className="mt-1 text-xs text-slate-300 max-w-2xl">
                {isLocked
                  ? `Operations locked at ${config.lockedAt ? new Date(config.lockedAt).toLocaleTimeString() : "recently"}. Reason: ${config.lockedReason || "Rogue rank threshold breach."}`
                  : `Sliding-window monitor tracks all demotion and exile calls. If any staff key or rogue bot exceeds ${config.maxDemotionsPerMinute} demotions in 60s, RankHub triggers an instant freeze.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isLocked ? (
              <button
                onClick={handleUnlock}
                disabled={isTogglingLock}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
              >
                <Unlock className="h-4 w-4" />
                <span>1-Click Unlock System</span>
              </button>
            ) : (
              <button
                onClick={handleSimulateLockdown}
                disabled={isTogglingLock}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-white transition-all"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Test Emergency Lockdown</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Threshold Configuration Form */}
      <div className="rounded-2xl border border-white/10 bg-[#0b0e14] p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Anti-Nuke Thresholds & Safeguards</h3>
          </div>
          {feedback && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{feedback}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Anti Nuke Toggle */}
            <div className="flex items-start justify-between rounded-xl border border-white/10 bg-black/30 p-4">
              <div>
                <div className="text-xs font-semibold text-white">Enable Anti-Nuke Detection</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Monitors and caps rapid rank drops across all API keys and bot sessions.
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.antiNukeEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, antiNukeEnabled: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-black text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            {/* Lock on Breach Toggle */}
            <div className="flex items-start justify-between rounded-xl border border-white/10 bg-black/30 p-4">
              <div>
                <div className="text-xs font-semibold text-white">Instant Lockdown on Breach</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Immediately reject and abort all ranking operations if threshold is breached.
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.lockOnBreach}
                onChange={(e) => setConfig((prev) => ({ ...prev, lockOnBreach: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-black text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            {/* Demotions per minute */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
              <label className="block text-xs font-semibold text-white">
                Max Demotions / Exiles Per Minute (60s Sliding Window)
              </label>
              <div className="text-[11px] text-slate-400">
                Default: 3/min. Exceeding this rate halts ranking to prevent group mass-exile.
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={config.maxDemotionsPerMinute}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, maxDemotionsPerMinute: parseInt(e.target.value) || 3 }))
                }
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Webhook notification URL */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <BellRing className="h-3.5 w-3.5 text-amber-400" />
                <span>Discord Security Alert Webhook</span>
              </label>
              <div className="text-[11px] text-slate-400">
                RankHub automatically fires an alert embed to this channel when a lockdown triggers.
              </div>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={config.notifyWebhookUrl || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, notifyWebhookUrl: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500 disabled:opacity-50"
            >
              {isSaving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSaving ? "Saving Settings..." : "Save Security Configuration"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
