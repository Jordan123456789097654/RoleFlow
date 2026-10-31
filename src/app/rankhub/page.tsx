"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  Zap,
  History,
  Sliders,
  ShieldCheck,
  ArrowLeft,
  Server,
  Lock,
  ExternalLink,
} from "lucide-react";

import { RankHubHero } from "@/components/rankhub/RankHubHero";
import { RankHubCredentialModal } from "@/components/rankhub/RankHubCredentialModal";
import { RankHubLadder } from "@/components/rankhub/RankHubLadder";
import { RankHubBatchQueue } from "@/components/rankhub/RankHubBatchQueue";
import { RankHubApplyHubRules } from "@/components/rankhub/RankHubApplyHubRules";
import { RankHubAuditLog } from "@/components/rankhub/RankHubAuditLog";

import type { GroupCredentialState, RankLadderRole } from "@/lib/rankhub-types";

export default function RankHubPage() {
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"batch" | "ladder" | "applyhub" | "audit">("batch");

  // Credential State
  const [credentialState, setCredentialState] = useState<GroupCredentialState>({
    groupId: "15982012",
    groupName: "Meridian Cafe & Studios",
    memberCount: 24890,
    authMethod: "both",
    openCloudConfigured: true,
    cookieConfigured: true,
    openCloudHealthy: true,
    cookieHealthy: true,
    botUsername: "RoleFlowBot_HQ",
    rankCeiling: 200,
    protectedRanks: [250, 254, 255],
    lastVerifiedAt: new Date().toISOString(),
  });

  // Ladder Roles State
  const [roles, setRoles] = useState<RankLadderRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  useEffect(() => {
    fetchLadderRoles();
  }, [credentialState.groupId]);

  const fetchLadderRoles = async () => {
    try {
      const res = await fetch("/api/rankhub/ladder");
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleCredentialsUpdated = (updated: Partial<GroupCredentialState>) => {
    setCredentialState((prev) => ({ ...prev, ...updated }));
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100">
      {/* Top Brand & Cross-Product Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#07090e]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-xs font-semibold sm:inline-block">RoleFlow Suite</span>
            </Link>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <img
                src="/brand/rankhub-logo.png"
                alt="RankHub"
                className="h-8 w-auto object-contain"
              />
              <span className="hidden font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400 sm:inline-block">
                RankHub
              </span>
            </div>
          </div>

          {/* Cross-Product Switcher Hub */}
          <div className="flex items-center gap-2 text-xs">
            <a
              href="https://applyhub.roleflow.site"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              ApplyHub
            </a>
            <a
              href="https://roster.roleflow.site"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Roster
            </a>
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-300 shadow-sm shadow-emerald-500/20">
              RankHub
            </span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Showcase Hero with Dual Auth status & Group selector */}
        <RankHubHero
          credentialState={credentialState}
          onOpenCredentialModal={() => setIsCredentialModalOpen(true)}
        />

        {/* Dashboard Workspace Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "batch"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Batch Rank Engine</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
              Dry-Run
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ladder")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "ladder"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Visual Ladder (1-255)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applyhub")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "applyhub"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>ApplyHub Auto-Promote</span>
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-mono text-[10px] text-violet-300">
              Live Link
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "audit"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Immutable Audit Log</span>
          </button>
        </div>

        {/* Tab View Contents */}
        <section>
          {activeTab === "batch" && (
            <RankHubBatchQueue
              availableRoles={roles}
              rankCeiling={credentialState.rankCeiling}
              protectedRanks={credentialState.protectedRanks}
            />
          )}

          {activeTab === "ladder" && (
            <RankHubLadder
              roles={roles}
              rankCeiling={credentialState.rankCeiling}
              protectedRanks={credentialState.protectedRanks}
              onSelectRoleForBatch={(role) => {
                setActiveTab("batch");
              }}
            />
          )}

          {activeTab === "applyhub" && (
            <RankHubApplyHubRules
              availableRoles={roles}
              rankCeiling={credentialState.rankCeiling}
            />
          )}

          {activeTab === "audit" && <RankHubAuditLog />}
        </section>
      </main>

      {/* Credential Configuration Modal */}
      <RankHubCredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        currentState={credentialState}
        onCredentialsUpdated={handleCredentialsUpdated}
      />
    </div>
  );
}
