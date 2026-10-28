"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, BadgeCheck, Users, Briefcase, Sparkles, CheckCircle2, ArrowLeft, Star, Search, AlertTriangle } from "lucide-react";

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
  const [unauthorized, setUnauthorized] = useState(false);
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
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        return;
      }
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading admin console...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          This console is restricted to the platform super-admin (Discord ID: 1046538179399929957). Please log in with your authorized Discord account.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/api/auth/login"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-600/30"
          >
            Login with Discord
          </a>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

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
        Back to RoleFlow Home
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
            <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Community</th>
                <th className="py-3 px-4">Guild ID</th>
                <th className="py-3 px-4">Openings</th>
                <th className="py-3 px-4">Applications</th>
                <th className="py-3 px-4">Badge Preset</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={g.icon || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
                        alt={g.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <span className="font-semibold text-white">{g.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{g.id}</td>
                  <td className="py-3 px-4">{g.positionsCount}</td>
                  <td className="py-3 px-4">{g.applicationsCount}</td>
                  <td className="py-3 px-4">
                    <select
                      value={badgeInputs[g.id] || "OFFICIAL"}
                      onChange={(e) =>
                        setBadgeInputs({ ...badgeInputs, [g.id]: e.target.value })
                      }
                      className="bg-surface border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="OFFICIAL">OFFICIAL (Purple)</option>
                      <option value="PARTNER">PARTNER (Cyan)</option>
                      <option value="VERIFIED">VERIFIED (Emerald)</option>
                      <option value="EARLY_ACCESS">EARLY_ACCESS (Amber)</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleVerify(g.id, g.isVerified)}
                      disabled={updatingId === g.id}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                        g.isVerified
                          ? "bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
                      }`}
                    >
                      {updatingId === g.id
                        ? "Saving..."
                        : g.isVerified
                        ? "Revoke Badge"
                        : "Grant Verified Badge"}
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
