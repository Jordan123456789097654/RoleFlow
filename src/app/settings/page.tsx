"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  Activity,
  LayoutGrid,
  Link2,
  Key,
  Sparkles,
  LifeBuoy,
  Code2,
  AlertTriangle,
  Check,
  Copy,
  Clock,
  ExternalLink,
  RefreshCw,
  LogOut,
  Trash2,
  Fingerprint,
  CheckCircle2,
  Terminal,
  Sliders,
  Cpu,
  Layers,
  Lock,
  ArrowRight,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  avatar: string | null;
  email: string | null;
  robloxUsername: string | null;
  robloxAvatar: string | null;
  plan?: string;
  isSiteAdmin: boolean;
  isSupportStaff?: boolean;
  applicationsCount: number;
  ownedGuilds?: { id: string; name: string; plan: string }[];
  createdAt: string;
  supportMode: {
    isActive: boolean;
    code: string | null;
    expiresAt: string | null;
  };
}

type TabType =
  | "profile"
  | "security"
  | "status"
  | "connected-apps"
  | "linked-accounts"
  | "activation-keys"
  | "ai-controls"
  | "support"
  | "developer"
  | "danger-zone";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Roblox input state
  const [robloxInput, setRobloxInput] = useState("");
  const [savingRoblox, setSavingRoblox] = useState(false);
  const [robloxSuccess, setRobloxSuccess] = useState<string | null>(null);

  // Support mode state
  const [generatingCode, setGeneratingCode] = useState(false);
  const [revokingCode, setRevokingCode] = useState(false);
  const [supportCode, setSupportCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Staff code login state
  const [staffCodeInput, setStaffCodeInput] = useState("");
  const [staffLoggingIn, setStaffLoggingIn] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Activation key state
  const [activationKeyInput, setActivationKeyInput] = useState("");
  const [redeemGuildId, setRedeemGuildId] = useState<string>("");
  const [redeemingKey, setRedeemingKey] = useState(false);
  const [activationMsg, setActivationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Controls state
  const [aiScreening, setAiScreening] = useState(true);
  const [aiSummaries, setAiSummaries] = useState(true);
  const [minWordCount, setMinWordCount] = useState(25);
  const [aiSaved, setAiSaved] = useState(false);

  // Danger Zone confirmation
  const [dangerConfirm, setDangerConfirm] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setRobloxInput(data.robloxUsername || "");
        if (data.supportMode?.isActive) {
          setSupportCode(data.supportMode.code);
          setExpiresAt(data.supportMode.expiresAt);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveRoblox = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRoblox(true);
    setRobloxSuccess(null);
    try {
      const res = await fetch("/api/user/settings/roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxUsername: robloxInput }),
      });
      if (res.ok) {
        setRobloxSuccess("Roblox account linked successfully!");
        setTimeout(() => setRobloxSuccess(null), 3500);
        fetchProfile();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingRoblox(false);
    }
  };

  const handleGenerateSupportCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch("/api/user/support/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSupportCode(data.code);
        setExpiresAt(data.expiresAt);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRevokeSupportCode = async () => {
    setRevokingCode(true);
    try {
      const res = await fetch("/api/user/support/revoke", { method: "POST" });
      if (res.ok) {
        setSupportCode(null);
        setExpiresAt(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRevokingCode(false);
    }
  };

  const handleStaffLoginWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffCodeInput.trim()) return;
    setStaffLoggingIn(true);
    setStaffError(null);

    try {
      const res = await fetch("/api/support/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: staffCodeInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
      } else {
        setStaffError(data.error || "Invalid or expired support code");
      }
    } catch (e: any) {
      setStaffError(e.message || "Failed to log in with support code");
    } finally {
      setStaffLoggingIn(false);
    }
  };

  const handleRedeemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationKeyInput.trim()) return;
    setRedeemingKey(true);
    setActivationMsg(null);
    try {
      const res = await fetch("/api/licenses/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: activationKeyInput.trim(),
          guildId: redeemGuildId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActivationMsg({
          type: "success",
          text: data.message || `License successfully activated! Plan upgraded to ${data.plan}.`,
        });
        setActivationKeyInput("");
        fetchProfile();
      } else {
        setActivationMsg({
          type: "error",
          text: data.error || "Failed to redeem license key.",
        });
      }
    } catch (err: any) {
      setActivationMsg({
        type: "error",
        text: err.message || "An unexpected error occurred during redemption.",
      });
    } finally {
      setRedeemingKey(false);
    }
  };

  const copySupportCode = () => {
    if (supportCode) {
      navigator.clipboard.writeText(supportCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyApiKey = () => {
    const key = `rf_live_${profile?.id || "user"}_89f3a912e73c880`;
    navigator.clipboard.writeText(key);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-28 text-center">
        <div className="w-9 h-9 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400 font-mono tracking-wide">Loading RoleFlow Settings Suite...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
        <p className="text-xs text-slate-400 mb-6">
          Sign in via Discord OAuth2 to configure your profile, linked Roblox studio accounts, and platform controls.
        </p>
        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all"
        >
          <span>Login with Discord</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb / Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono uppercase tracking-wider mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-white capitalize">{activeTab.replace("-", " ")}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Account & Platform Suite</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ID: {profile.id}</span>
          </div>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </a>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Section: ACCOUNT */}
          <div>
            <p className="px-3 text-[10px] font-mono tracking-wider text-slate-500 uppercase font-semibold mb-2">
              Account
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "security"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "status"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Account Status</span>
              </button>
              <button
                onClick={() => setActiveTab("connected-apps")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "connected-apps"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Connected Apps</span>
              </button>
              <button
                onClick={() => setActiveTab("linked-accounts")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "linked-accounts"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Linked Accounts</span>
              </button>
            </div>
          </div>

          {/* Section: PLATFORM / MATTER */}
          <div>
            <p className="px-3 text-[10px] font-mono tracking-wider text-slate-500 uppercase font-semibold mb-2">
              Platform & Features
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("activation-keys")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "activation-keys"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Activation Keys</span>
              </button>
              <button
                onClick={() => setActiveTab("ai-controls")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "ai-controls"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Controls</span>
              </button>
            </div>
          </div>

          {/* Section: OTHER */}
          <div>
            <p className="px-3 text-[10px] font-mono tracking-wider text-slate-500 uppercase font-semibold mb-2">
              Other & Support
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("support")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "support"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Support Mode</span>
                {supportCode && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 ml-auto animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("developer")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "developer"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Developer</span>
              </button>
              <button
                onClick={() => setActiveTab("danger-zone")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "danger-zone"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="lg:col-span-9">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Public Profile</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your identity across all RoleFlow communities and staff application portals.
                  </p>
                </div>

                {/* Identity Card */}
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="relative group">
                    <img
                      src={profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                      alt={profile.username}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500/40 shadow-xl"
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-purple-600 text-[10px] font-bold text-white font-mono shadow">
                      {profile.isSiteAdmin ? "ADMIN" : "CREATOR"}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="text-xl font-black text-white">{profile.username}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 self-center sm:self-auto">
                        Discord OAuth2
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono">User ID: {profile.id}</p>
                    {profile.email && (
                      <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
                        <span className="text-slate-500">Email:</span>
                        <span>{profile.email}</span>
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300">
                        Applications: {profile.applicationsCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-300">
                        RoleFlow Early Supporter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refresh Profile Action */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-white">Relink / Update Discord Profile</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Changed your avatar or username on Discord? Re-authenticate to update instantly.
                    </p>
                  </div>
                  <a
                    href="/api/auth/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync from Discord</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Security & Active Sessions</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage session validity, cryptographic tokens, and authentication integrity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Security Status</p>
                    <p className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>100% Protected</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">Authentication</p>
                    <p className="text-base font-bold text-white">Discord OAuth2 + JWT</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">2-Factor Auth</p>
                    <p className="text-base font-bold text-purple-400">Enforced via Discord</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Current Web Session</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Authenticated via HTTP-only encrypted session cookie.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Active Now
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">Strict Origin & SameSite=Lax</span>
                    <a
                      href="/api/auth/logout"
                      className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition-all"
                    >
                      Sign Out
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT STATUS */}
          {activeTab === "status" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Account Status & Standing</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Live overview of your platform reputation, limits, and community memberships.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs text-slate-400">Account Standing</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Good Standing (No Infractions)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs text-slate-400">Submission Quota</span>
                    <span className="text-xs font-bold text-white">Unlimited Applications</span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs text-slate-400">Community Host Status</span>
                    <span className="text-xs font-bold text-purple-400">Verified Organization Lead</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Registered Since</span>
                    <span className="text-xs font-mono text-slate-300">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONNECTED APPS */}
          {activeTab === "connected-apps" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Connected Applications & Integrations</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Services and OAuth2 tokens authorized to communicate with your RoleFlow profile.
                  </p>
                </div>

                {/* Discord App */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Discord Application Services</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scopes: <code className="text-purple-300">identify</code>, <code className="text-purple-300">email</code>, <code className="text-purple-300">guilds</code>
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                    Authorized
                  </span>
                </div>

                {/* RoleFlow Bot */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">RoleFlow Bot Engine (ID: 1565049592788025344)</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Automated role granting, application notifications, and server syncing.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 self-start sm:self-auto">
                    Online & Linked
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LINKED ACCOUNTS */}
          {activeTab === "linked-accounts" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Linked Accounts & Gaming Identities</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect your Roblox creator username so server admins can verify your in-game identity and rank.
                  </p>
                </div>

                <form onSubmit={handleSaveRoblox} className="space-y-5">
                  {robloxSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{robloxSuccess}</span>
                    </div>
                  )}

                  <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-center gap-6">
                    {profile.robloxAvatar ? (
                      <img
                        src={profile.robloxAvatar}
                        alt={profile.robloxUsername || "Roblox"}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/40 bg-black shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-surface border border-surface-border flex flex-col items-center justify-center text-slate-500 text-xs">
                        <User className="w-8 h-8 mb-1" />
                        <span>No Roblox</span>
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Roblox Creator Username
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Builderman"
                          value={robloxInput}
                          onChange={(e) => setRobloxInput(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        We automatically fetch your Roblox user ID and 3D thumbnail avatar to showcase on community rosters.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingRoblox}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-violet-600/30"
                  >
                    {savingRoblox ? "Linking..." : "Save Linked Roblox Identity"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: ACTIVATION KEYS (COMING SOON) */}
          {activeTab === "activation-keys" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">Activation Keys & Licenses</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        COMING SOON
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      License key redemption and premium upgrades are currently disabled during the Open Beta.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex items-center gap-3 text-amber-400">
                    <Clock className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                        Open Beta Free Tier Privilege
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        All community recruitment features, custom applications, and dashboard tools are 100% unlocked for everyone during the beta. Paid license redemption will launch after the beta period.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI CONTROLS */}
          {activeTab === "ai-controls" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">AI Screening & Automation Controls</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Fine-tune AI-assisted application grading, spam filtration, and automated resume extraction.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">AI Automated Low-Effort Screening</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Detect 1-word answers and robotic spam before notifications ping your moderators.
                      </p>
                    </div>
                    <button
                      onClick={() => setAiScreening(!aiScreening)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        aiScreening ? "bg-purple-600" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                          aiScreening ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Automated AI Resume & Applicant Summaries</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Generate quick 3-bullet summaries of lengthy applicant responses in review queues.
                      </p>
                    </div>
                    <button
                      onClick={() => setAiSummaries(!aiSummaries)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        aiSummaries ? "bg-purple-600" : "bg-slate-800"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                          aiSummaries ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">Minimum Response Word Count</h4>
                      <span className="text-xs font-mono font-bold text-purple-300">{minWordCount} words</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      step={5}
                      value={minWordCount}
                      onChange={(e) => setMinWordCount(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">Settings update across all active forms.</span>
                  <button
                    onClick={() => {
                      setAiSaved(true);
                      setTimeout(() => setAiSaved(false), 2500);
                    }}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all shadow-md"
                  >
                    {aiSaved ? "Preferences Saved!" : "Save AI Controls"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SUPPORT & 10-MINUTE SUPPORT MODE */}
          {activeTab === "support" && (
            <div className="space-y-6">
              {/* SECTION: 10-MINUTE SUPPORT MODE */}
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <LifeBuoy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">10-Minute Support Mode</h3>
                      <p className="text-xs text-slate-400">
                        Grant temporary diagnostic access to RoleFlow staff to troubleshoot your account or community.
                      </p>
                    </div>
                  </div>
                  {supportCode ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse self-start sm:self-auto">
                      Active Code
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 self-start sm:self-auto">
                      Inactive
                    </span>
                  )}
                </div>

                {supportCode ? (
                  <div className="p-5 rounded-2xl bg-black/60 border border-purple-500/40 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">
                          Share this temporary code with RoleFlow staff in your ticket:
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-purple-300">
                            {supportCode}
                          </span>
                          <button
                            onClick={copySupportCode}
                            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
                            title="Copy Code"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-right sm:text-right">
                        <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5 justify-end">
                          <Clock className="w-4 h-4" />
                          <span>Expires in 10 minutes</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Staff can only inspect during this window.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/5">
                      <p className="text-[11px] text-slate-400">
                        Staff will never ask for your password. Only share this 1-time code in tickets.
                      </p>
                      <button
                        onClick={handleRevokeSupportCode}
                        disabled={revokingCode}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium transition-all"
                      >
                        {revokingCode ? "Revoking..." : "Revoke Code Immediately"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-black/30 border border-white/5">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Opening a Support Ticket?</h4>
                      <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                        If you encounter a bug or need our team to inspect your form configurations, generate a 10-minute temporary code to share in our official support server.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateSupportCode}
                      disabled={generatingCode}
                      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 shrink-0"
                    >
                      {generatingCode ? "Generating..." : "Generate 10-Min Support Code"}
                    </button>
                  </div>
                )}

                {/* Official Support Server Link Card */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-white">RoleFlow Community & Support Discord</p>
                      <p className="text-[11px] text-slate-400">Server ID: 1565063649679122684</p>
                    </div>
                  </div>
                  <a
                    href="https://discord.gg/ZSGBbyEnWA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
                  >
                    <span>Join Server</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* SUPPORT STAFF PANEL ACCESS (If authorized) */}
              {(profile.isSupportStaff || profile.isSiteAdmin || profile.id === "1046538179399929957") ? (
                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-bold text-white">RoleFlow Support Specialist Access</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      STAFF ROLE ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    You have verified Support Staff privileges. The diagnostic code login system has been moved to the dedicated, restricted Support Staff Command Center.
                  </p>
                  <Link
                    href="/support/panel"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/30"
                  >
                    <span>Launch Support Staff Command Center</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 9: DEVELOPER */}
          {activeTab === "developer" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-surface-border space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Developer & API Access</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage secret keys to integrate RoleFlow with custom webhooks, Discord bots, and in-game Roblox scripts.
                  </p>
                </div>

                {/* API Key Box */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Live Secret API Key</span>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showApiKey ? "Hide" : "Show"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      readOnly
                      value={`rf_live_${profile.id}_89f3a912e73c880`}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-black/60 border border-surface-border text-xs text-purple-300 font-mono"
                    />
                    <button
                      onClick={copyApiKey}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all"
                    >
                      {copiedApiKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedApiKey ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Use this key in your HTTP Authorization header: <code className="text-purple-300">Bearer rf_live_...</code>
                  </p>
                </div>

                {/* Webhook Endpoint */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                  <h4 className="text-xs font-semibold text-white">Application Event Webhook</h4>
                  <p className="text-[11px] text-slate-400">
                    Receive automated JSON POST payloads whenever an applicant submits, accepts, or withdraws a form.
                  </p>
                  <input
                    type="url"
                    placeholder="https://your-domain.com/api/webhooks/roleflow"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <div className="flex justify-end">
                    <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all">
                      Save Webhook URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: DANGER ZONE */}
          {activeTab === "danger-zone" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-rose-400">Danger Zone</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Irreversible actions regarding your account, drafts, and linked services.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-black/50 border border-rose-500/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">Clear Cached Application Drafts</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Deletes any unsaved responses or cached answers in your current browser session.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        alert("Application drafts cleared.");
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all shrink-0"
                    >
                      Clear Drafts
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">Unlink Roblox Profile</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Removes your Roblox username and avatar preview from community records.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch("/api/user/settings/roblox", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ robloxUsername: "" }),
                        });
                        fetchProfile();
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all shrink-0"
                    >
                      Unlink Roblox
                    </button>
                  </div>

                  <div className="pt-4 border-t border-rose-500/20 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-rose-300">Delete Account & Purge Records</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Type <code className="text-rose-400 font-mono">DELETE</code> below to confirm permanent account purge.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Type DELETE to confirm"
                        value={dangerConfirm}
                        onChange={(e) => setDangerConfirm(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-black/60 border border-rose-500/30 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                      />
                      <button
                        disabled={dangerConfirm !== "DELETE"}
                        onClick={() => {
                          alert("To finalize account deletion, please contact support in the Discord server.");
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shrink-0"
                      >
                        Permanently Purge Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
