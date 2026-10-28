"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Briefcase,
  Users,
  Plus,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bot,
  Settings,
  Layers,
  ArrowRight,
  Server,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

interface GuildSummary {
  id: string;
  name: string;
  icon?: string | null;
  banner?: string | null;
  vanitySlug?: string | null;
  isVerified?: boolean;
  verifiedBadge?: string | null;
  verifiedBadges?: string | null;
  useCustomBot?: boolean;
  _count: {
    positions: number;
  };
  positions: Array<{
    id: string;
    title: string;
    isOpen: boolean;
    _count: {
      applications: number;
    };
  }>;
}

export default function DashboardHubPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [guilds, setGuilds] = useState<GuildSummary[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Connect form state
  const [serverId, setServerId] = useState("");
  const [serverName, setServerName] = useState("");
  const [vanitySlug, setVanitySlug] = useState("");
  const [description, setDescription] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuilds();
  }, []);

  async function fetchGuilds() {
    try {
      const res = await fetch("/api/guilds/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setGuilds(data.guilds || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      setConnectError("Community Name is required.");
      return;
    }

    setConnecting(true);
    setConnectError(null);

    try {
      const res = await fetch("/api/guilds/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: serverId.trim() || undefined,
          name: serverName.trim(),
          vanitySlug: vanitySlug.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize server.");
      }

      const created = await res.json();
      // Redirect to the newly created guild dashboard
      window.location.href = `/dashboard/${created.id}`;
    } catch (err: any) {
      setConnectError(err.message);
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading your server dashboards...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">
          <Server className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect with Discord to manage your community, review applicants, and configure bot automations.
        </p>
        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/30"
        >
          <span>Login with Discord</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // Calculate totals across all managed guilds
  const totalPositions = guilds.reduce((acc, g) => acc + (g._count?.positions || 0), 0);
  const totalApplications = guilds.reduce(
    (acc, g) =>
      acc + (g.positions || []).reduce((pAcc, p) => pAcc + (p._count?.applications || 0), 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-surface-border">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
            alt={user.username}
            className="w-14 h-14 rounded-2xl border-2 border-purple-500/40 object-cover shadow-xl shadow-purple-500/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Welcome, {user.username}
              </h1>
              {user.isSiteAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  SITE ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select a Discord community to review applicants, edit questions, or customize server automations.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-600/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Discord Server</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        <div className="p-5 rounded-2xl bg-surface/60 border border-surface-border/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Connected Communities</p>
            <p className="text-2xl font-black text-white mt-1">{guilds.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface/60 border border-surface-border/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Openings</p>
            <p className="text-2xl font-black text-white mt-1">{totalPositions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface/60 border border-surface-border/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Applications Received</p>
            <p className="text-2xl font-black text-white mt-1">{totalApplications}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Guilds List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Your Communities ({guilds.length})
          </h2>
          {guilds.length === 0 && (
            <p className="text-xs text-slate-400">No servers connected yet.</p>
          )}
        </div>

        {guilds.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface/30 border border-dashed border-surface-border">
            <Server className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No Discord Servers Connected</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Connect your Discord community to unlock the visual form builder, applicant Kanban, and automated role granting.
            </p>
            <button
              onClick={() => {
                setServerId("1565063649679122684");
                setServerName("RoleFlow Official");
                setVanitySlug("roleflow");
                setShowConnectModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all"
            >
              Connect Server (1565063649679122684)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {guilds.map((g) => {
              const appCount = (g.positions || []).reduce(
                (acc, p) => acc + (p._count?.applications || 0),
                0
              );

              return (
                <div
                  key={g.id}
                  className="rounded-2xl bg-surface/80 border border-surface-border/80 hover:border-purple-500/40 p-5 transition-all shadow-xl group flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={g.icon || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"}
                          alt={g.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                              {g.name}
                            </h3>
                            {g.isVerified && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {(g.verifiedBadges || g.verifiedBadge || "OFFICIAL")
                                  .split(",")
                                  .map((b) => b.trim())
                                  .filter(Boolean)
                                  .map((badge) => (
                                    <span
                                      key={badge}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold"
                                    >
                                      <BadgeCheck className="w-3 h-3 text-purple-400 fill-purple-400/20" />
                                      {badge.replace("_", " ")}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ID: {g.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {g.vanitySlug && (
                          <Link
                            href={`/c/${g.vanitySlug}`}
                            target="_blank"
                            title="View Public Apply Portal"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/${g.id}`}
                          className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 py-3 border-y border-surface-border/60">
                      <div>
                        <span className="font-bold text-white">{g._count?.positions || 0}</span> Openings
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <div>
                        <span className="font-bold text-white">{appCount}</span> Applications
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <div className="flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        <span>{g.useCustomBot ? "Custom Bot" : "Web Mode"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 pt-1">
                    <Link
                      href={`/dashboard/${g.id}?tab=builder`}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white text-center transition-colors border border-white/5"
                    >
                      Form Builder
                    </Link>
                    <Link
                      href={`/dashboard/${g.id}?tab=applications`}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white text-center transition-colors border border-white/5"
                    >
                      Kanban Review
                    </Link>
                    <Link
                      href={`/dashboard/${g.id}?tab=bot`}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white text-center transition-colors border border-white/5"
                    >
                      Bot Settings
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Server Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Create or Connect Community</h3>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} className="mt-4 space-y-4">
              {connectError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {connectError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Community Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RoleFlow Studios, Apex Community"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>Discord Server ID</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1565063649679122684 (leave blank if no Discord)"
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Optional. If provided, enables Discord role sync and audit logs. Leave blank to manage via web only.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Vanity Slug (Optional)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-black/20 border border-r-0 border-surface-border rounded-l-xl text-[11px] text-slate-500">
                    roleflow.site/c/
                  </span>
                  <input
                    type="text"
                    placeholder="my-community"
                    value={vanitySlug}
                    onChange={(e) => setVanitySlug(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-r-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe your community or what positions you are hiring for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/30"
                >
                  {connecting ? "Initializing..." : "Create & Manage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
