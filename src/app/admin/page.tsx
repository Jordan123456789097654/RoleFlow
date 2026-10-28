"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  BadgeCheck,
  Users,
  Briefcase,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Star,
  Search,
  AlertTriangle,
  LifeBuoy,
  UserCheck,
  UserMinus,
  ExternalLink,
  Megaphone,
  Pause,
  Play,
  Trash2,
  Ban,
  UserX,
  Plus,
  Key,
  Copy,
  Check,
  Lock,
  Unlock,
  Clock,
  Layers,
  Wrench,
  Bug,
  Lightbulb,
} from "lucide-react";

interface LicenseKeyItem {
  id: string;
  key: string;
  tier: string;
  scope: string;
  durationDays: number | null;
  maxUses: number;
  usesCount: number;
  isRevoked: boolean;
  note: string | null;
  expiresAt: string | null;
  redeemedBy: string | null;
  redeemedByName: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

interface AdminGuild {
  id: string;
  name: string;
  icon?: string | null;
  vanitySlug?: string | null;
  isVerified: boolean;
  verifiedBadge?: string | null;
  verifiedBadges?: string | null;
  isPaused?: boolean;
  memberCount: number;
  tags?: string | null;
  positionsCount: number;
  applicationsCount: number;
}

interface AdminUser {
  id: string;
  username: string;
  avatar: string | null;
  email: string | null;
  robloxUsername: string | null;
  isSiteAdmin: boolean;
  isSupportStaff: boolean;
  siteRole?: string | null;
  isBanned?: boolean;
  createdAt: string;
  _count: {
    applications: number;
  };
}

interface ChangelogItem {
  id: string;
  version: string;
  title: string;
  content: string;
  tag: string;
  isPublished: boolean;
  publishedAt: string;
}

interface BlacklistEntry {
  id: string;
  targetType: string;
  targetValue: string;
  reason?: string | null;
  createdAt: string;
}

export default function SiteAdminPage() {
  const [activeTab, setActiveTab] = useState<"guilds" | "staff" | "licenses" | "changelog" | "blacklist" | "feedback">("guilds");
  const [guilds, setGuilds] = useState<AdminGuild[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [blacklists, setBlacklists] = useState<BlacklistEntry[]>([]);
  const [licenses, setLicenses] = useState<LicenseKeyItem[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [licenseSearch, setLicenseSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [badgeInputs, setBadgeInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  // Maintenance Mode state
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMsgInput, setMaintenanceMsgInput] = useState("");
  const [updatingMaintenance, setUpdatingMaintenance] = useState(false);

  // New License Key generator state
  const [newKeyTier, setNewKeyTier] = useState<"PRO" | "ENTERPRISE" | "LIFETIME">("PRO");
  const [newKeyScope, setNewKeyScope] = useState<"GUILD" | "USER">("GUILD");
  const [newKeyDuration, setNewKeyDuration] = useState<string>("null");
  const [newKeyMaxUses, setNewKeyMaxUses] = useState<number>(1);
  const [newKeyCustom, setNewKeyCustom] = useState<string>("");
  const [newKeyNote, setNewKeyNote] = useState<string>("");
  const [generatingKey, setGeneratingKey] = useState<boolean>(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Changelog state
  const [newVersion, setNewVersion] = useState("v1.3.0");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTag, setNewTag] = useState("FEATURE");
  const [broadcasting, setBroadcasting] = useState(false);

  // New Blacklist state
  const [newTargetType, setNewTargetType] = useState<"DISCORD_ID" | "ROBLOX_ID">("DISCORD_ID");
  const [newTargetVal, setNewTargetVal] = useState("");
  const [newTargetReason, setNewTargetReason] = useState("");
  const [blacklisting, setBlacklisting] = useState(false);

  useEffect(() => {
    fetchGuilds();
    fetchUsers();
    fetchLicenses();
    fetchChangelogs();
    fetchBlacklists();
    fetchMaintenance();
    fetchFeedback();
  }, []);

  async function fetchMaintenance() {
    try {
      const res = await fetch("/api/admin/maintenance");
      if (res.ok) {
        const data = await res.json();
        setMaintenanceEnabled(data.enabled);
        if (data.message) {
          setMaintenanceMsgInput(data.message);
        }
        setMaintenanceMsgInput(data.message || "");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchFeedback() {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleToggleMaintenance = async () => {
    setUpdatingMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: !maintenanceEnabled,
          message: maintenanceMsgInput,
        }),
      });
      if (res.ok) {
        setMaintenanceEnabled(!maintenanceEnabled);
        setMessage(!maintenanceEnabled ? "Platform Maintenance Mode Activated!" : "Maintenance Mode Disabled. Public access restored.");
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingMaintenance(false);
    }
  };

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

  async function fetchUsers(query: string = "") {
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchChangelogs() {
    try {
      const res = await fetch("/api/changelog");
      if (res.ok) {
        const data = await res.json();
        setChangelogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchBlacklists() {
    try {
      const res = await fetch("/api/admin/blacklist");
      if (res.ok) {
        const data = await res.json();
        setBlacklists(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleToggleBadge = async (guildId: string, badgeName: string) => {
    const guild = guilds.find((g) => g.id === guildId);
    if (!guild) return;
    const current = (guild.verifiedBadges || guild.verifiedBadge || "")
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    const updated = current.includes(badgeName)
      ? current.filter((b) => b !== badgeName)
      : [...current, badgeName];

    // Optimistic update
    setGuilds((prev) =>
      prev.map((g) =>
        g.id === guildId
          ? { ...g, verifiedBadges: updated.join(","), isVerified: updated.length > 0 }
          : g
      )
    );

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          verifiedBadges: updated,
          isVerified: updated.length > 0,
        }),
      });
      if (res.ok) {
        setMessage(`Updated badges for ${guild.name}!`);
        setTimeout(() => setMessage(null), 3000);
        fetchGuilds();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateFeedbackStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes }),
      });
      if (res.ok) {
        setMessage("Feedback status updated!");
        setTimeout(() => setMessage(null), 3000);
        fetchFeedback();
      }
    } catch (e) {
      console.error(e);
    }
  };

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
        setMessage(`Updated verification badge for community!`);
        setTimeout(() => setMessage(null), 3000);
        fetchGuilds();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePauseGuild = async (guildId: string, currentPaused: boolean) => {
    try {
      const res = await fetch(`/api/admin/guilds`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          isPaused: !currentPaused,
        }),
      });

      if (res.ok) {
        setMessage(!currentPaused ? "Community paused." : "Community resumed.");
        setTimeout(() => setMessage(null), 3000);
        fetchGuilds();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGuild = async (guildId: string, guildName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete community "${guildName}"? This will delete all positions and applications.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/guilds?guildId=${guildId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage(`Community "${guildName}" permanently deleted.`);
        setTimeout(() => setMessage(null), 3000);
        fetchGuilds();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetUserRole = async (targetUserId: string, newRole: string) => {
    setUpdatingUserId(targetUserId);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          siteRole: newRole,
        }),
      });

      if (res.ok) {
        setMessage(`Updated role to ${newRole}!`);
        setTimeout(() => setMessage(null), 3000);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUserId
              ? {
                  ...u,
                  siteRole: newRole,
                  isSiteAdmin: newRole === "ADMIN" || newRole === "FOUNDER",
                  isSupportStaff: newRole !== "USER",
                }
              : u
          )
        );
      } else {
        const err = await res.json();
        setMessage(err.error || "Failed to update role");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleSupportStaff = async (targetUserId: string, currentStatus: boolean) => {
    handleSetUserRole(targetUserId, currentStatus ? "USER" : "SUPPORT");
  };

  const handleCreateChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion || !newTitle || !newContent) return;
    setBroadcasting(true);
    try {
      const res = await fetch("/api/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: newVersion,
          title: newTitle,
          content: newContent,
          tag: newTag,
        }),
      });

      if (res.ok) {
        setMessage("Update log broadcasted! Users will see the popup upon opening the website.");
        setTimeout(() => setMessage(null), 4000);
        setNewTitle("");
        setNewContent("");
        fetchChangelogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleDeleteChangelog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast log?")) return;
    try {
      const res = await fetch(`/api/changelog?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Changelog deleted.");
        setTimeout(() => setMessage(null), 3000);
        fetchChangelogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetVal.trim()) return;
    setBlacklisting(true);
    try {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: newTargetType,
          targetValue: newTargetVal.trim(),
          reason: newTargetReason.trim() || undefined,
        }),
      });

      if (res.ok) {
        setMessage("Target added to Global Blacklist.");
        setTimeout(() => setMessage(null), 3000);
        setNewTargetVal("");
        setNewTargetReason("");
        fetchBlacklists();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBlacklisting(false);
    }
  };

  const handleDeleteBlacklist = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blacklist?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Target unbanned and removed from Global Blacklist.");
        setTimeout(() => setMessage(null), 3000);
        fetchBlacklists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function fetchLicenses() {
    try {
      const res = await fetch("/api/admin/licenses");
      if (res.ok) {
        const data = await res.json();
        setLicenses(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleRandomizeKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const pick = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const prefix = `RF-${newKeyTier.toUpperCase().slice(0, 4)}`;
    setNewKeyCustom(`${prefix}-${pick(4)}-${pick(4)}-${pick(4)}`);
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customKey: newKeyCustom.trim() || undefined,
          tier: newKeyTier,
          scope: newKeyScope,
          durationDays: newKeyDuration === "null" ? null : parseInt(newKeyDuration, 10),
          maxUses: newKeyMaxUses,
          note: newKeyNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Generated license key: ${data.license.key}`);
        setTimeout(() => setMessage(null), 4000);
        setNewKeyCustom("");
        setNewKeyNote("");
        fetchLicenses();
      } else {
        alert(data.error || "Failed to generate license key");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleToggleRevokeLicense = async (id: string, currentRevoked: boolean) => {
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isRevoked: !currentRevoked,
        }),
      });

      if (res.ok) {
        setMessage(!currentRevoked ? "License key revoked." : "License key reactivated.");
        setTimeout(() => setMessage(null), 3000);
        fetchLicenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this license key?")) return;
    try {
      const res = await fetch(`/api/admin/licenses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("License key deleted.");
        setTimeout(() => setMessage(null), 3000);
        fetchLicenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading Founder Admin Console...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Founder Access Required</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          This console is restricted to the platform Founder (Discord ID: 1046538179399929957). Please log in with your authorized Discord account.
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to RoleFlow Home</span>
        </Link>
        <Link
          href="/support/panel"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Open Support Staff Panel</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl font-black text-white">Founder Master Command Console</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
              Jordan (Founder)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Oversee communities, broadcast platform update logs, enforce global blacklists, and manage staff authority.
          </p>
        </div>

        {message && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 self-start sm:self-auto animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Platform Maintenance Mode Toggle */}
      <div
        className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 ${
          maintenanceEnabled
            ? "bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-500/10"
            : "bg-black/30 border-white/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                maintenanceEnabled
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-white/5 text-slate-400"
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Platform Maintenance Mode</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    maintenanceEnabled
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {maintenanceEnabled ? "ACTIVE (PUBLIC ACCESS BLOCKED)" : "DISABLED (PUBLIC ACCESSIBLE)"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                When enabled, only verified Support Staff and Founders can navigate the site. All other visitors see the maintenance screen.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMaintenance}
            disabled={updatingMaintenance}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
              maintenanceEnabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{updatingMaintenance ? "Updating..." : maintenanceEnabled ? "Deactivate Maintenance" : "Activate Maintenance Mode"}</span>
          </button>
        </div>

        {/* Custom Maintenance Reason / Notice Input */}
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Public Maintenance Reason & Status Message:
            </label>
            <input
              type="text"
              value={maintenanceMsgInput}
              onChange={(e) => setMaintenanceMsgInput(e.target.value)}
              placeholder="e.g., Upgrading database clusters and Discord gateway infrastructure. Expected downtime: ~20 mins."
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              setUpdatingMaintenance(true);
              try {
                const res = await fetch("/api/admin/maintenance", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    enabled: maintenanceEnabled,
                    message: maintenanceMsgInput,
                  }),
                });
                if (res.ok) {
                  setMessage("Maintenance reason updated successfully!");
                  setTimeout(() => setMessage(null), 3000);
                }
              } catch (e) {
                console.error(e);
              } finally {
                setUpdatingMaintenance(false);
              }
            }}
            disabled={updatingMaintenance}
            className="self-end px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all shrink-0"
          >
            Save Reason
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-surface-border pb-3">
        <button
          onClick={() => setActiveTab("guilds")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "guilds"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>Communities ({guilds.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "staff"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Site Staff & Admins ({users.filter((u) => u.isSupportStaff || u.isSiteAdmin || u.siteRole).length})</span>
        </button>
        <button
          onClick={() => setActiveTab("licenses")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "licenses"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>License Keys (Coming Soon)</span>
        </button>
        <button
          onClick={() => setActiveTab("changelog")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "changelog"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast Update Logs ({changelogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("blacklist")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "blacklist"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
              : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Global Blacklist ({blacklists.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "feedback"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>Feedback & Bugs ({feedbackList.length})</span>
        </button>
      </div>

      {/* TAB 1: COMMUNITIES */}
      {activeTab === "guilds" && (
        <div className="space-y-6">
          {/* Global Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Total Communities</span>
              <span className="text-2xl font-bold text-white">{guilds.length}</span>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Verified Partners</span>
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
              <span className="text-xs text-slate-400 font-mono">
                {filtered.length} communities
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Community</th>
                    <th className="py-3 px-4">Guild ID</th>
                    <th className="py-3 px-4">Openings</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Badge</th>
                    <th className="py-3 px-4 text-right">Founder Management Actions</th>
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
                      <td className="py-3 px-4">
                        {g.isPaused ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            PAUSED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {["OFFICIAL", "PARTNER", "VERIFIED", "TOP_STUDIO", "COMMUNITY_FAVORITE", "EARLY_ADOPTER"].map((b) => {
                            const activeBadges = (g.verifiedBadges || g.verifiedBadge || "")
                              .split(",")
                              .map((x) => x.trim());
                            const hasBadge = activeBadges.includes(b);
                            return (
                              <button
                                key={b}
                                type="button"
                                onClick={() => handleToggleBadge(g.id, b)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all border ${
                                  hasBadge
                                    ? b === "PARTNER"
                                      ? "bg-purple-500 text-white border-purple-400"
                                      : b === "TOP_STUDIO"
                                      ? "bg-amber-500 text-white border-amber-400"
                                      : b === "COMMUNITY_FAVORITE"
                                      ? "bg-rose-500 text-white border-rose-400"
                                      : b === "EARLY_ADOPTER"
                                      ? "bg-cyan-500 text-white border-cyan-400"
                                      : "bg-blue-500 text-white border-blue-400"
                                    : "bg-white/5 text-slate-400 border-white/5 hover:border-white/20"
                                }`}
                                title={hasBadge ? `Remove ${b}` : `Add ${b}`}
                              >
                                {hasBadge ? `✓ ${b.replace("_", " ")}` : `+ ${b.replace("_", " ")}`}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Badge */}
                          <button
                            onClick={() => handleToggleVerify(g.id, g.isVerified)}
                            disabled={updatingId === g.id}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                              g.isVerified
                                ? "bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/30"
                                : "bg-purple-600 hover:bg-purple-500 text-white"
                            }`}
                          >
                            {g.isVerified ? "Revoke Badge" : "Badge"}
                          </button>

                          {/* Pause / Resume */}
                          <button
                            onClick={() => handleTogglePauseGuild(g.id, !!g.isPaused)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              g.isPaused
                                ? "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border-emerald-500/30"
                                : "bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border-amber-500/30"
                            }`}
                            title={g.isPaused ? "Resume Community" : "Pause Community"}
                          >
                            {g.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Community */}
                          <button
                            onClick={() => handleDeleteGuild(g.id, g.name)}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition-all"
                            title="Permanently Delete Community"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPORT STAFF ROSTER */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <LifeBuoy className="w-4 h-4 text-purple-400" />
                <span>Support Staff Role Delegation</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Members marked as Support Staff gain access to the private Support Staff Command Center (`/support/panel`) and can initiate 10-minute diagnostic sessions using codes provided in tickets.
              </p>
            </div>
            <Link
              href="/support/panel"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Visit Staff Panel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
              <div className="relative w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by username, Roblox or ID..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    fetchUsers(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {users.length} members found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Discord ID</th>
                    <th className="py-3 px-4">Roblox Linked</th>
                    <th className="py-3 px-4">Current Authority</th>
                    <th className="py-3 px-4 text-right">Support Staff Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                            alt={u.username}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div>
                            <span className="font-semibold text-white block">{u.username}</span>
                            {u.email && <span className="text-[10px] text-slate-500">{u.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{u.id}</td>
                      <td className="py-3 px-4">
                        {u.robloxUsername ? (
                          <span className="text-emerald-400 font-mono font-medium">@{u.robloxUsername}</span>
                        ) : (
                          <span className="text-slate-500">Unlinked</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.id === "1046538179399929957" ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono inline-flex items-center gap-1 shadow-sm">
                            👑 FOUNDER
                          </span>
                        ) : u.siteRole === "ADMIN" || u.isSiteAdmin ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono inline-flex items-center gap-1">
                            🛡️ SITE ADMIN
                          </span>
                        ) : u.siteRole === "MODERATOR" ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono inline-flex items-center gap-1">
                            ⚖️ MODERATOR
                          </span>
                        ) : u.siteRole === "SUPPORT" || u.isSupportStaff ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono inline-flex items-center gap-1">
                            🎧 SUPPORT SPECIALIST
                          </span>
                        ) : u.siteRole === "STAFF" ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono inline-flex items-center gap-1">
                            📋 ORDINARY STAFF
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] bg-white/5 text-slate-400 font-mono inline-flex items-center gap-1">
                            👤 MEMBER
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id === "1046538179399929957" ? (
                          <span className="text-[11px] text-amber-400 font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            Platform Founder
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={u.siteRole || (u.isSiteAdmin ? "ADMIN" : u.isSupportStaff ? "SUPPORT" : "USER")}
                              onChange={(e) => handleSetUserRole(u.id, e.target.value)}
                              disabled={updatingUserId === u.id}
                              className="px-2.5 py-1 rounded-lg bg-surface border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
                            >
                              <option value="USER" className="bg-surface text-slate-300">Member</option>
                              <option value="STAFF" className="bg-surface text-purple-300">Ordinary Staff</option>
                              <option value="SUPPORT" className="bg-surface text-blue-300">Support Specialist</option>
                              <option value="MODERATOR" className="bg-surface text-emerald-300">Platform Moderator</option>
                              <option value="ADMIN" className="bg-surface text-rose-300">Site Administrator</option>
                            </select>
                            {updatingUserId === u.id && (
                              <span className="text-[10px] text-purple-400 font-mono animate-pulse">Saving...</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LICENSE KEYS GENERATOR & MANAGEMENT */}
      {activeTab === "licenses" && (
        <div className="space-y-6">
          {/* Top Banner Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Total Generated</span>
              <span className="text-2xl font-bold text-white">{licenses.length}</span>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Active / Available</span>
              <span className="text-2xl font-bold text-emerald-400">
                {licenses.filter((l) => !l.isRevoked && l.usesCount < l.maxUses).length}
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Fully Redeemed</span>
              <span className="text-2xl font-bold text-purple-400">
                {licenses.filter((l) => l.usesCount >= l.maxUses).length}
              </span>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-white/5">
              <span className="text-xs text-slate-400 block mb-1">Revoked Keys</span>
              <span className="text-2xl font-bold text-rose-400">
                {licenses.filter((l) => l.isRevoked).length}
              </span>
            </div>
          </div>

          {/* Create License Key Form */}
          <form
            onSubmit={handleCreateLicense}
            className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Generate RoleFlow License Key</h3>
                  <p className="text-xs text-slate-400">
                    Create customized premium licenses for communities or user accounts.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRandomizeKey}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Format Random Key</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subscription Tier</label>
                <select
                  value={newKeyTier}
                  onChange={(e) => setNewKeyTier(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="PRO">PRO Tier (Advanced Features)</option>
                  <option value="ENTERPRISE">ENTERPRISE Tier (Custom Bots & Priority)</option>
                  <option value="LIFETIME">LIFETIME Access (Perpetual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">License Scope</label>
                <select
                  value={newKeyScope}
                  onChange={(e) => setNewKeyScope(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="GUILD">Community / Guild License</option>
                  <option value="USER">User Account License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Duration & Expiration</label>
                <select
                  value={newKeyDuration}
                  onChange={(e) => setNewKeyDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="null">Lifetime (No Expiration)</option>
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (3 Months)</option>
                  <option value="365">365 Days (1 Full Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Max Redemptions</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={newKeyMaxUses}
                  onChange={(e) => setNewKeyMaxUses(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Key Code <span className="text-slate-500 font-normal">(Leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. RF-PRO-9A8B-7C6D-E5F4"
                  value={newKeyCustom}
                  onChange={(e) => setNewKeyCustom(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Internal Founder Note <span className="text-slate-500 font-normal">(Optional context)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Issued to Jordan Studios • Partner Agreement"
                  value={newKeyNote}
                  onChange={(e) => setNewKeyNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generatingKey}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{generatingKey ? "Generating..." : "Generate & Issue License Key"}</span>
            </button>
          </form>

          {/* License Keys Ledger */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by key code, note, or redeemer..."
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {licenses.length} keys in directory
              </span>
            </div>

            {licenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No license keys generated yet. Use the form above to issue your first key.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">License Code</th>
                      <th className="py-3 px-4">Tier & Scope</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Redemptions</th>
                      <th className="py-3 px-4">Redeemed By</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {licenses
                      .filter(
                        (l) =>
                          l.key.toLowerCase().includes(licenseSearch.toLowerCase()) ||
                          (l.note && l.note.toLowerCase().includes(licenseSearch.toLowerCase())) ||
                          (l.redeemedByName && l.redeemedByName.toLowerCase().includes(licenseSearch.toLowerCase()))
                      )
                      .map((lic) => {
                        const isRedeemed = lic.usesCount >= lic.maxUses;
                        return (
                          <tr key={lic.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <code className="font-mono font-bold text-white tracking-wider bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                                  {lic.key}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(lic.key, lic.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                  title="Copy license key"
                                >
                                  {copiedKeyId === lic.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              {lic.note && (
                                <span className="text-[10px] text-slate-400 block mt-1 font-sans">
                                  {lic.note}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    lic.tier === "LIFETIME"
                                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                      : lic.tier === "ENTERPRISE"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  }`}
                                >
                                  {lic.tier}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {lic.scope === "GUILD" ? "COMMUNITY" : "USER"}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono text-slate-400">
                              {lic.durationDays ? `${lic.durationDays} Days` : "Lifetime"}
                            </td>

                            <td className="py-3 px-4 font-mono">
                              <span
                                className={
                                  isRedeemed
                                    ? "text-purple-400 font-bold"
                                    : "text-slate-300"
                                }
                              >
                                {lic.usesCount} / {lic.maxUses}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {lic.redeemedByName ? (
                                <div>
                                  <span className="font-semibold text-white block">
                                    {lic.redeemedByName}
                                  </span>
                                  {lic.redeemedAt && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {new Date(lic.redeemedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Unclaimed</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {lic.isRevoked ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                                  REVOKED
                                </span>
                              ) : isRedeemed ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                                  REDEEMED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRevokeLicense(lic.id, lic.isRevoked)}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    lic.isRevoked
                                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                                      : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30"
                                  }`}
                                  title={lic.isRevoked ? "Reactivate license" : "Revoke license"}
                                >
                                  {lic.isRevoked ? (
                                    <Unlock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLicense(lic.id)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors"
                                  title="Delete key"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST UPDATE LOGS */}
      {activeTab === "changelog" && (
        <div className="space-y-6">
          {/* Create Update Log Form */}
          <form
            onSubmit={handleCreateChangelog}
            className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Broadcast New Platform Update Log</h3>
            </div>
            <p className="text-xs text-slate-400">
              When submitted, this changelog will automatically pop up as an announcement modal to all users the next time they visit the website.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Version Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. v1.3.0"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Release Category</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                >
                  <option value="FEATURE">FEATURE (New Capabilities)</option>
                  <option value="MAJOR">MAJOR (Major Platform Overhaul)</option>
                  <option value="IMPROVEMENT">IMPROVEMENT (Speed & Usability)</option>
                  <option value="HOTFIX">HOTFIX (Bug Fixes)</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-300 mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Support Command Center & Blind Review Voting"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Release Notes & Description
              </label>
              <textarea
                rows={4}
                required
                placeholder="• Added Support Staff Panel with 10-minute session codes&#10;• Added Roblox Group Rank Verification&#10;• Added Staff Blind Voting mode"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>{broadcasting ? "Broadcasting..." : "Broadcast Update Log to All Users"}</span>
            </button>
          </form>

          {/* Past Broadcasted Logs */}
          <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
            <h4 className="text-sm font-bold text-white">Previous Broadcasts ({changelogs.length})</h4>
            {changelogs.length === 0 ? (
              <p className="text-xs text-slate-400">No updates broadcasted yet.</p>
            ) : (
              <div className="space-y-3">
                {changelogs.map((cl) => (
                  <div
                    key={cl.id}
                    className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{cl.version}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {cl.tag}
                        </span>
                        <span className="text-xs font-bold text-white">• {cl.title}</span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap pl-2 leading-relaxed">
                        {cl.content}
                      </p>
                      <span className="text-[10px] text-slate-500 block pt-1">
                        Broadcasted: {new Date(cl.publishedAt).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteChangelog(cl.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/20 transition-all shrink-0"
                      title="Delete changelog"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL BLACKLIST */}
      {activeTab === "blacklist" && (
        <div className="space-y-6">
          {/* Add Target to Blacklist Form */}
          <form
            onSubmit={handleAddBlacklist}
            className="glass-panel p-6 sm:p-8 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Platform Global Blacklist / Ban User</h3>
            </div>
            <p className="text-xs text-slate-400">
              Users on the global blacklist are prohibited from authenticating via Discord or submitting applications across all RoleFlow communities.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Type</label>
                <select
                  value={newTargetType}
                  onChange={(e) => setNewTargetType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                >
                  <option value="DISCORD_ID">Discord User ID</option>
                  <option value="ROBLOX_ID">Roblox Username</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Identifier</label>
                <input
                  type="text"
                  required
                  placeholder={newTargetType === "DISCORD_ID" ? "e.g. 1046538179399929957" : "e.g. BadUser123"}
                  value={newTargetVal}
                  onChange={(e) => setNewTargetVal(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ban Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Spammed malicious links or alt accounts"
                  value={newTargetReason}
                  onChange={(e) => setNewTargetReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={blacklisting || !newTargetVal.trim()}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{blacklisting ? "Blacklisting..." : "Blacklist User Globally"}</span>
            </button>
          </form>

          {/* Blacklisted Targets Table */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Globally Blacklisted Entities ({blacklists.length})
              </h4>
            </div>

            {blacklists.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No users are currently on the global blacklist.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Target Type</th>
                      <th className="py-3 px-4">Identifier / ID</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {blacklists.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {entry.targetType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-white font-bold">{entry.targetValue}</td>
                        <td className="py-3 px-4 text-slate-400">{entry.reason || "No reason specified"}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteBlacklist(entry.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
                          >
                            Unban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* TAB 5: FEEDBACK & BUG REPORTS */}
      {activeTab === "feedback" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-rose-400" />
                <span>Community Feedback & Bug Triage</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect, triage, and reply to technical bug reports and feature proposals submitted by users.
              </p>
            </div>
            <Link
              href="/feedback"
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Public Feedback Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                All Reports & Suggestions ({feedbackList.length})
              </span>
            </div>

            {feedbackList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No feedback reports logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Title & Details</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {feedbackList.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              item.type === "BUG_REPORT"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            }`}
                          >
                            {item.type === "BUG_REPORT" ? "BUG" : "PROPOSAL"}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-sm">
                          <span className="font-bold text-white block">{item.title}</span>
                          <span className="text-xs text-slate-400 line-clamp-2 mt-0.5 whitespace-pre-wrap">
                            {item.description}
                          </span>
                          {item.adminNotes && (
                            <span className="text-[10px] text-purple-400 block mt-1">
                              Staff Note: {item.adminNotes}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {item.severity ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                item.severity === "CRITICAL"
                                  ? "bg-rose-600 text-white"
                                  : item.severity === "HIGH"
                                  ? "bg-amber-600 text-white"
                                  : "bg-white/5 text-slate-400 border border-white/10"
                              }`}
                            >
                              {item.severity}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-300 font-medium block">
                            {item.authorName || "Member"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateFeedbackStatus(item.id, e.target.value)}
                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="UNDER_REVIEW">UNDER REVIEW</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="DISMISSED">DISMISSED</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const note = prompt("Enter developer note for this report:", item.adminNotes || "");
                              if (note !== null) {
                                handleUpdateFeedbackStatus(item.id, item.status, note);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/10"
                          >
                            Add Note
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
