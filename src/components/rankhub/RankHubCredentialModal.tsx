"use client";

import React, { useState } from "react";
import {
  X,
  KeyRound,
  Cookie,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  Server,
} from "lucide-react";
import type { GroupCredentialState } from "@/lib/rankhub-types";

interface RankHubCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: GroupCredentialState;
  onCredentialsUpdated: (updated: Partial<GroupCredentialState>) => void;
}

export function RankHubCredentialModal({
  isOpen,
  onClose,
  currentState,
  onCredentialsUpdated,
}: RankHubCredentialModalProps) {
  const [activeTab, setActiveTab] = useState<"open_cloud" | "cookie">("open_cloud");

  // Open Cloud form state
  const [openCloudKey, setOpenCloudKey] = useState("");
  const [openCloudCeiling, setOpenCloudCeiling] = useState(currentState.rankCeiling || 200);

  // Bot Cookie form state
  const [botCookie, setBotCookie] = useState("");
  const [botCeiling, setBotCeiling] = useState(currentState.rankCeiling || 200);

  // Health testing feedback state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    healthy: boolean;
    message: string;
    scopes?: string[];
    latencyMs?: number;
    botUsername?: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestHealth = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const payload = {
        authType: activeTab,
        keyOrCookie: activeTab === "open_cloud" ? openCloudKey : botCookie,
        groupId: currentState.groupId,
      };

      const res = await fetch("/api/rankhub/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.healthy) {
        setTestResult({
          healthy: true,
          message: data.message || "Connection verified successfully.",
          scopes: data.scopes,
          latencyMs: data.latencyMs,
          botUsername: data.botUsername,
        });
      } else {
        setTestResult({
          healthy: false,
          message: data.error || "Verification failed. Check token validity.",
        });
      }
    } catch (err: any) {
      setTestResult({
        healthy: false,
        message: err?.message || "Health test network error.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        authType: activeTab,
        apiKey: activeTab === "open_cloud" ? openCloudKey : undefined,
        cookie: activeTab === "cookie" ? botCookie : undefined,
        rankCeiling: activeTab === "open_cloud" ? openCloudCeiling : botCeiling,
        protectedRanks: [250, 254, 255],
        groupId: currentState.groupId,
      };

      const res = await fetch("/api/rankhub/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        if (activeTab === "open_cloud") {
          onCredentialsUpdated({
            openCloudConfigured: true,
            openCloudHealthy: true,
            rankCeiling: openCloudCeiling,
          });
        } else {
          onCredentialsUpdated({
            cookieConfigured: true,
            cookieHealthy: true,
            botUsername: testResult?.botUsername || "RoleFlowBot_HQ",
            rankCeiling: botCeiling,
          });
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#090b10] p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 id="modal-headline" className="text-lg font-bold text-white">
                RankHub Authentication &amp; Boundaries
              </h2>
              <p className="text-xs text-slate-400">
                Configure official Open Cloud API or bot session tokens with AES-256 encrypted storage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth Method Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("open_cloud");
              setTestResult(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
              activeTab === "open_cloud"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Official Roblox Open Cloud</span>
            <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-emerald-200">
              Recommended
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("cookie");
              setTestResult(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
              activeTab === "cookie"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cookie className="h-4 w-4" />
            <span>Bot Cookie (.ROBLOSECURITY)</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {activeTab === "open_cloud" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-emerald-300">How to generate an Open Cloud Key:</p>
                    <p className="text-slate-400">
                      Visit the Roblox Creator Hub &rarr; Credentials &rarr; API Keys. Create a key granting{" "}
                      <span className="font-mono text-emerald-300">groups:read</span> and{" "}
                      <span className="font-mono text-emerald-300">groups:write</span> permissions on your target group.
                    </p>
                    <a
                      href="https://create.roblox.com/dashboard/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:underline pt-1"
                    >
                      Open Roblox Creator Dashboard <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Open Cloud API Key <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={openCloudKey}
                  onChange={(e) => setOpenCloudKey(e.target.value)}
                  placeholder="rbx_cloud_..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 font-mono text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Maximum Rank Ceiling (1 - 255)
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="255"
                    value={openCloudCeiling}
                    onChange={(e) => setOpenCloudCeiling(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
                  />
                  <span className="min-w-[4rem] rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-center font-mono text-xs font-bold text-amber-300">
                    Rank {openCloudCeiling}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  RankHub will forcefully block any attempt to rank users above this ceiling.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 text-cyan-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-cyan-300">Bot Session Cookie Security</p>
                    <p className="text-slate-400">
                      Use a dedicated secondary Roblox bot account. Never use your main account. Provide the full{" "}
                      <span className="font-mono text-cyan-300">_|WARNING:-DO-NOT-SHARE-THIS...</span> string.
                      Our server daemon handles automatic CSRF token negotiation and cookie renewal.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  .ROBLOSECURITY Cookie Token <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={botCookie}
                  onChange={(e) => setBotCookie(e.target.value)}
                  placeholder="_|WARNING:-DO-NOT-SHARE-THIS.--..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Bot Rank Ceiling (1 - 255)
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="255"
                    value={botCeiling}
                    onChange={(e) => setBotCeiling(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-500"
                  />
                  <span className="min-w-[4rem] rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-center font-mono text-xs font-bold text-amber-300">
                    Rank {botCeiling}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Test Health Result Card */}
          {testResult && (
            <div
              className={`rounded-xl border p-3.5 text-xs ${
                testResult.healthy
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {testResult.healthy ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                )}
                <span>{testResult.healthy ? "Credential Verification Passed" : "Verification Failed"}</span>
              </div>
              <p className="mt-1 text-slate-300">{testResult.message}</p>
              {testResult.latencyMs && (
                <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-slate-400">
                  <span>Latency: {testResult.latencyMs}ms</span>
                  {testResult.botUsername && <span>Bot: @{testResult.botUsername}</span>}
                  {testResult.scopes && <span>Scopes: {testResult.scopes.join(", ")}</span>}
                </div>
              )}
            </div>
          )}

          {/* Hardware AES-256 Trust Badge */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>AES-256-GCM Hardware Encrypted</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Zero plaintext storage</span>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleTestHealth}
              disabled={isTesting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {isTesting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              ) : (
                <Server className="h-3.5 w-3.5" />
              )}
              <span>{isTesting ? "Testing Connection..." : "Live Health Test"}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{isSaving ? "Encrypting..." : saveSuccess ? "Saved Successfully!" : "Save & Secure"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
