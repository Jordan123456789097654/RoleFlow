"use client";

import React, { useState } from "react";
import {
  Layers,
  Lock,
  Shield,
  ShieldAlert,
  Users,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import type { RankLadderRole } from "@/lib/rankhub-types";

interface RankHubLadderProps {
  roles: RankLadderRole[];
  rankCeiling: number;
  protectedRanks: number[];
  onSelectRoleForBatch?: (role: RankLadderRole) => void;
}

export function RankHubLadder({
  roles,
  rankCeiling,
  protectedRanks,
  onSelectRoleForBatch,
}: RankHubLadderProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [showProtectedOnly, setShowProtectedOnly] = useState(false);

  // Sort descending: Rank 255 at top to Rank 1 at bottom
  const sortedRoles = [...roles].sort((a, b) => b.rank - a.rank);

  const filteredRoles = sortedRoles.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      String(r.rank).includes(filterQuery);
    if (showProtectedOnly) {
      return matchesSearch && (protectedRanks.includes(r.rank) || r.rank >= rankCeiling);
    }
    return matchesSearch;
  });

  const totalMembers = roles.reduce((acc, curr) => acc + (curr.memberCount || 0), 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090b10] p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Visual Rank Hierarchy</h2>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-slate-400 border border-white/10">
              {roles.length} Configured Ranks
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Interactive representation of ranks 1 through 255. Protected tiers and rank ceilings are strictly locked.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Total Group Members:</span>{" "}
            <span className="font-mono font-bold text-white">{totalMembers.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Ceiling: Rank {rankCeiling}</span>
          </div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter ranks by name or rank number (e.g. 250)..."
          className="w-full max-w-sm rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProtectedOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
              showProtectedOnly
                ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{showProtectedOnly ? "Showing Boundary Ranks" : "Filter Protected / Ceilings"}</span>
          </button>
        </div>
      </div>

      {/* Visual Rank Ladder List */}
      <div className="mt-5 space-y-2.5">
        {filteredRoles.map((role) => {
          const isAboveCeiling = role.rank > rankCeiling;
          const isCeilingEdge = role.rank === rankCeiling;
          const isProtected = protectedRanks.includes(role.rank);

          let borderClass = "border-white/10 bg-white/[0.02] hover:border-white/20";
          let badgeText = "Automated Ranking Permitted";
          let badgeColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";

          if (isAboveCeiling || isProtected) {
            borderClass = "border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50";
            badgeText = isProtected ? "Protected Role Boundary" : "Exceeds Rank Ceiling";
            badgeColor = "text-amber-300 border-amber-500/30 bg-amber-500/10";
          } else if (isCeilingEdge) {
            borderClass = "border-rose-500/40 bg-rose-500/[0.05] hover:border-rose-500/60";
            badgeText = "Highest Automated Rank Ceiling";
            badgeColor = "text-rose-300 border-rose-500/30 bg-rose-500/10";
          }

          return (
            <div
              key={role.id || role.rank}
              className={`group flex flex-col gap-3 rounded-xl border p-3.5 transition-all sm:flex-row sm:items-center sm:justify-between ${borderClass}`}
            >
              <div className="flex items-center gap-3.5">
                {/* Rank Number Badge */}
                <div
                  className={`flex h-9 w-12 items-center justify-center rounded-lg border font-mono text-xs font-bold ${
                    isAboveCeiling || isProtected
                      ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {role.rank}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      {role.name}
                    </span>
                    {(isAboveCeiling || isProtected) && (
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-500" />
                      {role.memberCount.toLocaleString()} Members
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">Role ID #{role.id}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action CTAs */}
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${badgeColor}`}>
                  {badgeText}
                </span>

                {onSelectRoleForBatch && !isAboveCeiling && !isProtected && (
                  <button
                    type="button"
                    onClick={() => onSelectRoleForBatch(role)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                  >
                    <span>Target</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredRoles.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
            No roles matched your filter query.
          </div>
        )}
      </div>
    </div>
  );
}
