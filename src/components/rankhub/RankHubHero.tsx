"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Cookie,
  Server,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock,
} from "lucide-react";
import type { GroupCredentialState } from "@/lib/rankhub-types";

interface RankHubHeroProps {
  credentialState: GroupCredentialState;
  onOpenCredentialModal: () => void;
  onSwitchGroup?: (groupId: string) => void;
  availableGroups?: Array<{ id: string; name: string; memberCount: number }>;
}

export function RankHubHero({
  credentialState,
  onOpenCredentialModal,
  onSwitchGroup,
  availableGroups = [
    { id: "15982012", name: "Meridian Cafe & Studios", memberCount: 24890 },
    { id: "88219412", name: "Redwood County Sheriff", memberCount: 14200 },
    { id: "33109281", name: "Vortex Interactive Games", memberCount: 52100 },
  ],
}: RankHubHeroProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(credentialState.groupId);

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroupId(e.target.value);
    if (onSwitchGroup) onSwitchGroup(e.target.value);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#07090e] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      {/* Background ambient neon glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand identity & Group Selector */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <img
              src="/brand/rankhub-logo.png"
              alt="RankHub"
              className="h-10 w-auto object-contain drop-shadow-[0_0_16px_rgba(16,185,129,0.35)]"
            />
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              v1.0 Stage-1 Core
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-slate-400">
              Zero Latency Rank Engine
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Automated Roblox Group Hierarchy &amp; Mass Ranking
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            Execute batch promotions, simulate test changes with Dry-Run safety, enforce strict role ceilings,
            and auto-rank incoming ApplyHub graduates without manual intervention.
          </p>

          {/* Group Selector Dropdown */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300">
              <Server className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-slate-400">Target Group:</span>
              <select
                value={selectedGroupId}
                onChange={handleGroupChange}
                aria-label="Target Roblox Group"
                className="cursor-pointer bg-transparent font-medium text-white outline-none focus:text-emerald-400"
              >
                {availableGroups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                    {g.name} ({g.memberCount.toLocaleString()} members)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RankHub Relay Online</span>
            </div>
          </div>
        </div>

        {/* Live dual-auth status cards and configuration CTA */}
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
          {/* Dual Auth Badges */}
          <div className="grid grid-cols-2 gap-2.5 sm:w-80">
            {/* Open Cloud API Status */}
            <div
              className={`rounded-xl border p-3 transition-colors ${
                credentialState.openCloudConfigured && credentialState.openCloudHealthy
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Open Cloud</span>
                </div>
                {credentialState.openCloudHealthy ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                )}
              </div>
              <p className="mt-1 font-mono text-[10px] opacity-80">
                {credentialState.openCloudHealthy ? "High-Speed Key Active" : "Not Linked"}
              </p>
            </div>

            {/* Bot Cookie Status */}
            <div
              className={`rounded-xl border p-3 transition-colors ${
                credentialState.cookieConfigured && credentialState.cookieHealthy
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Cookie className="h-3.5 w-3.5" />
                  <span>Bot Session</span>
                </div>
                {credentialState.cookieHealthy ? (
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                )}
              </div>
              <p className="mt-1 font-mono text-[10px] opacity-80">
                {credentialState.cookieHealthy ? `@${credentialState.botUsername || "RoleFlowBot"}` : "Unconfigured"}
              </p>
            </div>
          </div>

          {/* Rank Ceiling Indicator & Credential Config Trigger */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">Ceiling:</span>
              <span className="font-mono font-bold text-amber-300">Rank {credentialState.rankCeiling}</span>
            </div>

            <button
              type="button"
              onClick={onOpenCredentialModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_14px_rgba(16,185,129,0.3)] transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-95"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Configure Auth &amp; Ceilings</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Security notice bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Credentials stored with AES-256-GCM hardware encryption. Zero raw token export.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
          <span>Protected Roles: {credentialState.protectedRanks.join(", ")}</span>
          <span>•</span>
          <span>Open Cloud V2 API Compliant</span>
        </div>
      </div>
    </div>
  );
}
