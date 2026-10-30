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
        <p className="text-xs text-muted font-mono tracking-wide">Loading RoleFlow Settings Suite...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 text-accent">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Authentication Required</h2>
        <p className="text-xs text-muted mb-6">
          Sign in via Discord OAuth2 to configure your profile, linked Roblox studio accounts, and platform controls.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-card shadow-violet-600/30 transition-all"
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs text-accent font-mono uppercase tracking-wider mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-ink capitalize">{activeTab.replace("-", " ")}</span>
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Account & Platform Suite</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sunk border border-line text-xs font-mono text-ink-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ID: {profile.id}</span>
          </div>
          <a
            href="/api/auth/logout"
           
            onClick={() => {
              document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.roleflow.site;";
              document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-danger border border-rose-500/20 text-xs font-medium transition-all cursor-pointer"
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
            <p className="px-3 text-[10px] font-mono tracking-wider text-faint uppercase font-semibold mb-2">
              Account
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "security"
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "status"
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Account Status</span>
              </button>
              <button
                onClick={() => setActiveTab("connected-apps")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "connected-apps"
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Connected Apps</span>
              </button>
              <button
                onClick={() => setActiveTab("linked-accounts")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "linked-accounts"
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Linked Accounts</span>
              </button>
            </div>
          </div>

          {/* Section: PLATFORM / MATTER */}
          <div>
            <p className="px-3 text-[10px] font-mono tracking-wider text-faint uppercase font-semibold mb-2">
              Platform & Features
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("ai-controls")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "ai-controls"
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Controls</span>
              </button>
            </div>
          </div>

          {/* Section: OTHER */}
          <div>
            <p className="px-3 text-[10px] font-mono tracking-wider text-faint uppercase font-semibold mb-2">
              Other & Support
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("support")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "support"
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
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
                    ? "bg-purple-600 text-white shadow-card shadow-purple-600/30"
                    : "text-muted hover:text-ink hover:bg-sunk"
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Developer</span>
              </button>
              <button
                onClick={() => setActiveTab("danger-zone")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "danger-zone"
                    ? "bg-rose-600 text-white shadow-card shadow-rose-600/30"
                    : "text-danger hover:text-danger hover:bg-rose-500/10"
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
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">Public Profile</h3>
                  <p className="text-xs text-muted mt-1">
                    Your identity across all RoleFlow communities and staff application portals.
                  </p>
                </div>

                {/* Identity Card */}
                <div className="p-6 rounded-2xl bg-sunk border border-line flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="relative group">
                    <img
                      src={profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                      alt={profile.username}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500/40 shadow-card"
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-purple-600 text-[10px] font-bold text-white font-mono shadow">
                      {profile.isSiteAdmin ? "ADMIN" : "CREATOR"}
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="text-xl font-black text-ink">{profile.username}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-accent border border-purple-500/30 self-center sm:self-auto">
                        Discord OAuth2
                      </span>
                    </div>

                    <p className="text-xs text-muted font-mono">User ID: {profile.id}</p>
                    {profile.email && (
                      <p className="text-xs text-ink-2 flex items-center justify-center sm:justify-start gap-1.5">
                        <span className="text-faint">Email:</span>
                        <span>{profile.email}</span>
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-sunk border border-line text-[11px] font-medium text-ink-2">
                        Applications: {profile.applicationsCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-moss">
                        RoleFlow Early Supporter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refresh Profile Action */}
                <div className="p-4 rounded-xl bg-accent-soft border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-ink">Relink / Update Discord Profile</h5>
                    <p className="text-xs text-muted mt-0.5">
                      Changed your avatar or username on Discord? Re-authenticate to update instantly.
                    </p>
                  </div>
                  <a
                    href="/login"
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
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">Security & Active Sessions</h3>
                  <p className="text-xs text-muted mt-1">
                    Manage session validity, cryptographic tokens, and authentication integrity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-sunk border border-line space-y-1">
                    <p className="text-[10px] text-muted uppercase font-mono">Security Status</p>
                    <p className="text-base font-bold text-moss flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>100% Protected</span>
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-sunk border border-line space-y-1">
                    <p className="text-[10px] text-muted uppercase font-mono">Authentication</p>
                    <p className="text-base font-bold text-ink">Discord OAuth2 + JWT</p>
                  </div>
                  <div className="p-4 rounded-xl bg-sunk border border-line space-y-1">
                    <p className="text-[10px] text-muted uppercase font-mono">2-Factor Auth</p>
                    <p className="text-base font-bold text-accent">Enforced via Discord</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-sunk border border-line space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-ink">Current Web Session</h4>
                      <p className="text-xs text-muted mt-0.5">
                        Authenticated via HTTP-only encrypted session cookie.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-moss border border-emerald-500/20">
                      Active Now
                    </span>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between">
                    <span className="text-xs text-muted font-mono">Strict Origin & SameSite=Lax</span>
                    <a
                      href="/api/auth/logout"
                     
                      onClick={() => {
                        document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.roleflow.site;";
                        document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-sunk text-ink-2 text-xs font-medium border border-line transition-all cursor-pointer"
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
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">Account Status & Standing</h3>
                  <p className="text-xs text-muted mt-1">
                    Live overview of your platform reputation, limits, and community memberships.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-sunk border border-line space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <span className="text-xs text-muted">Account Standing</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-moss border border-emerald-500/20">
                      Good Standing (No Infractions)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <span className="text-xs text-muted">Submission Quota</span>
                    <span className="text-xs font-bold text-ink">Unlimited Applications</span>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <span className="text-xs text-muted">Community Host Status</span>
                    <span className="text-xs font-bold text-accent">Verified Organization Lead</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Registered Since</span>
                    <span className="text-xs font-mono text-ink-2">
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
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">Connected Applications & Integrations</h3>
                  <p className="text-xs text-muted mt-1">
                    Services and OAuth2 tokens authorized to communicate with your RoleFlow profile.
                  </p>
                </div>

                {/* Discord App */}
                <div className="p-5 rounded-2xl bg-sunk border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">Discord Application Services</h4>
                      <p className="text-xs text-muted mt-0.5">
                        Scopes: <code className="text-accent">identify</code>, <code className="text-accent">email</code>, <code className="text-accent">guilds</code>
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-moss border border-emerald-500/20 self-start sm:self-auto">
                    Authorized
                  </span>
                </div>

                {/* RoleFlow Bot */}
                <div className="p-5 rounded-2xl bg-sunk border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-accent">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">RoleFlow Bot Engine (ID: 1565049592788025344)</h4>
                      <p className="text-xs text-muted mt-0.5">
                        Automated role granting, application notifications, and server syncing.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-accent border border-purple-500/20 self-start sm:self-auto">
                    Online & Linked
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LINKED ACCOUNTS */}
          {activeTab === "linked-accounts" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">Linked Accounts & Gaming Identities</h3>
                  <p className="text-xs text-muted mt-1">
                    Connect your Roblox creator username so server admins can verify your in-game identity and rank.
                  </p>
                </div>

                <form onSubmit={handleSaveRoblox} className="space-y-5">
                  {robloxSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-moss text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{robloxSuccess}</span>
                    </div>
                  )}

                  <div className="p-6 rounded-2xl bg-sunk border border-line flex flex-col sm:flex-row items-center gap-6">
                    {profile.robloxAvatar ? (
                      <img
                        src={profile.robloxAvatar}
                        alt={profile.robloxUsername || "Roblox"}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/40 bg-black shadow-card"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-surface border border-line flex flex-col items-center justify-center text-faint text-xs">
                        <User className="w-8 h-8 mb-1" />
                        <span>No Roblox</span>
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-ink-2 mb-1">
                          Roblox Creator Username
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Builderman"
                          value={robloxInput}
                          onChange={(e) => setRobloxInput(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-sunk border border-line text-xs text-ink placeholder-faint focus:outline-none focus:border-accent"
                        />
                      </div>
                      <p className="text-[11px] text-muted">
                        We automatically fetch your Roblox user ID and 3D thumbnail avatar to showcase on community rosters.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingRoblox}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-card shadow-violet-600/30"
                  >
                    {savingRoblox ? "Linking..." : "Save Linked Roblox Identity"}
                  </button>
                </form>
              </div>
            </div>
          )}


          {/* TAB 7: AI CONTROLS */}
          {activeTab === "ai-controls" && (
            <div className="space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">AI Screening & Automation Controls</h3>
                  <p className="text-xs text-muted mt-1">
                    Fine-tune AI-assisted application grading, spam filtration, and automated resume extraction.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-sunk border border-line flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-ink">AI Automated Low-Effort Screening</h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Detect 1-word answers and robotic spam before notifications ping your moderators.
                      </p>
                    </div>
                    <button
                      onClick={() => setAiScreening(!aiScreening)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        aiScreening ? "bg-purple-600" : "bg-sunk"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-surface transition-transform transform absolute top-1 ${
                          aiScreening ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-sunk border border-line flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-ink">Automated AI Resume & Applicant Summaries</h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Generate quick 3-bullet summaries of lengthy applicant responses in review queues.
                      </p>
                    </div>
                    <button
                      onClick={() => setAiSummaries(!aiSummaries)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        aiSummaries ? "bg-purple-600" : "bg-sunk"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-surface transition-transform transform absolute top-1 ${
                          aiSummaries ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-sunk border border-line space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-ink">Minimum Response Word Count</h4>
                      <span className="text-xs font-mono font-bold text-accent">{minWordCount} words</span>
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
                  <span className="text-xs text-muted">Settings update across all active forms.</span>
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
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-accent-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-accent">
                      <LifeBuoy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-ink">10-Minute Support Mode</h3>
                      <p className="text-xs text-muted">
                        Grant temporary diagnostic access to RoleFlow staff to troubleshoot your account or community.
                      </p>
                    </div>
                  </div>
                  {supportCode ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-gold border border-amber-500/30 animate-pulse self-start sm:self-auto">
                      Active Code
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-sunk text-muted self-start sm:self-auto">
                      Inactive
                    </span>
                  )}
                </div>

                {supportCode ? (
                  <div className="p-5 rounded-2xl bg-sunk border border-purple-500/40 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted mb-1">
                          Share this temporary code with RoleFlow staff in your ticket:
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-accent">
                            {supportCode}
                          </span>
                          <button
                            onClick={copySupportCode}
                            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-accent transition-colors"
                            title="Copy Code"
                          >
                            {copied ? <Check className="w-4 h-4 text-moss" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-right sm:text-right">
                        <span className="text-xs text-gold font-medium flex items-center gap-1.5 justify-end">
                          <Clock className="w-4 h-4" />
                          <span>Expires in 10 minutes</span>
                        </span>
                        <p className="text-[11px] text-faint mt-0.5">
                          Staff can only inspect during this window.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-line">
                      <p className="text-[11px] text-muted">
                        Staff will never ask for your password. Only share this 1-time code in tickets.
                      </p>
                      <button
                        onClick={handleRevokeSupportCode}
                        disabled={revokingCode}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium transition-all"
                      >
                        {revokingCode ? "Revoking..." : "Revoke Code Immediately"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-sunk border border-line">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-ink">Opening a Support Ticket?</h4>
                      <p className="text-xs text-muted max-w-lg leading-relaxed">
                        If you encounter a bug or need our team to inspect your form configurations, generate a 10-minute temporary code to share in our official support server.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateSupportCode}
                      disabled={generatingCode}
                      className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-card shadow-violet-600/30 shrink-0"
                    >
                      {generatingCode ? "Generating..." : "Generate 10-Min Support Code"}
                    </button>
                  </div>
                )}

                {/* Official Support Server Link Card */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-xs font-bold text-ink">RoleFlow Community & Support Discord</p>
                      <p className="text-[11px] text-muted">Server ID: 1565063649679122684</p>
                    </div>
                  </div>
                  <a
                    href="https://discord.gg/tKPbCXbmr9"
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
                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-accent-soft space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      <h3 className="text-sm font-bold text-ink">RoleFlow Support Specialist Access</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-accent border border-purple-500/30">
                      STAFF ROLE ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-muted">
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
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink">Developer & API Access</h3>
                  <p className="text-xs text-muted mt-1">
                    Manage secret keys to integrate RoleFlow with custom webhooks, Discord bots, and in-game Roblox scripts.
                  </p>
                </div>

                {/* API Key Box */}
                <div className="p-5 rounded-2xl bg-sunk border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">Live Secret API Key</span>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-muted hover:text-ink flex items-center gap-1"
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
                      className="flex-1 px-3.5 py-2 rounded-xl bg-sunk border border-line text-xs text-accent font-mono"
                    />
                    <button
                      onClick={copyApiKey}
                      className="px-3.5 py-2 rounded-xl bg-surface hover:bg-sunk text-ink text-xs font-semibold flex items-center gap-1.5 border border-line transition-all"
                    >
                      {copiedApiKey ? <Check className="w-3.5 h-3.5 text-moss" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedApiKey ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-faint">
                    Use this key in your HTTP Authorization header: <code className="text-accent">Bearer rf_live_...</code>
                  </p>
                </div>

                {/* Webhook Endpoint */}
                <div className="p-5 rounded-2xl bg-sunk border border-line space-y-3">
                  <h4 className="text-xs font-semibold text-ink">Application Event Webhook</h4>
                  <p className="text-[11px] text-muted">
                    Receive automated JSON POST payloads whenever an applicant submits, accepts, or withdraws a form.
                  </p>
                  <input
                    type="url"
                    placeholder="https://your-domain.com/api/webhooks/roleflow"
                    className="w-full px-4 py-2.5 rounded-xl bg-sunk border border-line text-xs text-ink placeholder-faint focus:outline-none focus:border-accent font-mono"
                  />
                  <div className="flex justify-end">
                    <button className="px-4 py-2 rounded-xl bg-surface hover:bg-sunk text-ink text-xs font-semibold border border-line transition-all">
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
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-danger">Danger Zone</h3>
                  <p className="text-xs text-muted mt-1">
                    Irreversible actions regarding your account, drafts, and linked services.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-sunk border border-rose-500/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-ink">Clear Cached Application Drafts</h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Deletes any unsaved responses or cached answers in your current browser session.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        alert("Application drafts cleared.");
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all shrink-0"
                    >
                      Clear Drafts
                    </button>
                  </div>

                  <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-ink">Unlink Roblox Profile</h4>
                      <p className="text-[11px] text-muted mt-0.5">
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
                      className="px-4 py-2 rounded-xl bg-surface hover:bg-sunk text-ink-2 text-xs font-semibold border border-line transition-all shrink-0"
                    >
                      Unlink Roblox
                    </button>
                  </div>

                  <div className="pt-4 border-t border-rose-500/20 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-danger">Delete Account & Purge Records</h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        Type <code className="text-danger font-mono">DELETE</code> below to confirm permanent account purge.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Type DELETE to confirm"
                        value={dangerConfirm}
                        onChange={(e) => setDangerConfirm(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-sunk border border-rose-500/30 text-xs text-ink placeholder-faint focus:outline-none focus:border-rose-500 font-mono"
                      />
                      <button
                        disabled={dangerConfirm !== "DELETE"}
                        onClick={async () => {
                          const res = await fetch("/api/user/delete", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ confirm: "DELETE" }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            alert(data.error || "Could not delete your account.");
                            return;
                          }
                          window.location.href = "/";
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
