"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, BadgeCheck, Users, Briefcase, Sparkles, CheckCircle2, ArrowLeft, Star, Search } from "lucide-react";

interface AdminGuild {
  id: string;
  name: string;
  icon?: string | null;
  vanitySlug?: string | null;
  isVerified: boolean;
  verifiedBadge?: string | null;
  memberCount: number;
  tags?: string | null;
  positionsCount: number;
  applicationsCount: number;
}

export default function SiteAdminPage() {
  const [guilds, setGuilds] = useState<AdminGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [badgeInputs, setBadgeInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchGuilds();
  }, []);

  async function fetchGuilds() {
    try {
      const res = await fetch("/api/admin/guilds");
      if (res.ok) {
        const data = await res.json();
        setGuilds(data);
        const map: Record<string, string> = {};
        data.forEach((g: AdminGuild) => {
          map[g.id] = g.verifiedBadge || "OFFICIAL";
        });
        setBadgeInputs(map);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleVerify = async (guildId: string, currentStatus: boolean) => {
    setUpdatingId(guildId);
    try {
      const res = await fetch(`/api/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          isVerified: !currentStatus,
          verifiedBadge: badgeInputs[guildId] || "OFFICIAL",
        }),
      });

      if (res.ok) {
        setMessage(`Updated verification for community!`);
        setTimeout(() => setMessage(null), 3000);
        fetchGuilds();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = guilds.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to AppliX Home
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl font-extrabold text-white">Site Admin Console</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Super-Admin
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Award verified badges, feature top Roblox studios, and oversee platform integrity.
          </p>
        </div>

        {message && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-panel rounded-2xl p-4 border border-white/5">
          <span className="text-xs text-slate-400 block mb-1">Total Communities</span>
          <span className="text-2xl font-bold text-white">{guilds.length}</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-white/5">
          <span className="text-xs text-slate-400 block mb-1">Verified Communities</span>
          <span className="text-2xl font-bold text-purple-400">
            {guilds.filter((g) => g.isVerified).length}
          </span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-white/5">
          <span className="text-xs text-slate-400 block mb-1">Active Positions</span>
          <span className="text-2xl font-bold text-emerald-400">
            {guilds.reduce((acc, curr) => acc + curr.positionsCount, 0)}
          </span>
        </div>
      </div>

      {/* Communities Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search community name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            {filtered.length} communities listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/80 border-b border-white/5 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Community</th>
                <th className="p-4">Status & Openings</th>
                <th className="p-4">Badge Title</th>
                <th className="p-4 text-right">Award Verified Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-card border border-white/10 overflow-hidden shrink-0">
                        {g.icon ? (
                          <img src={g.icon} alt={g.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-violet-600 flex items-center justify-center font-bold text-white">
                            {g.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{g.name}</span>
                          {g.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {g.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="space-y-0.5">
                      <span className="text-slate-300 block">
                        {g.positionsCount} openings • {g.applicationsCount} apps
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {g.memberCount.toLocaleString()} Discord members
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <input
                      type="text"
                      value={badgeInputs[g.id] || "OFFICIAL"}
                      onChange={(e) =>
                        setBadgeInputs({ ...badgeInputs, [g.id]: e.target.value })
                      }
                      placeholder="e.g. PARTNER, OFFICIAL"
                      className="px-2.5 py-1 rounded-lg bg-surface border border-white/10 text-xs text-purple-300 w-36 uppercase font-mono focus:outline-none focus:border-purple-500"
                    />
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleVerify(g.id, g.isVerified)}
                      disabled={updatingId === g.id}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                        g.isVerified
                          ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                          : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30"
                      }`}
                    >
                      {g.isVerified ? "Revoke Verification" : "Award Verified"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
