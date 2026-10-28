"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Shield,
  Key,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  LifeBuoy,
  MessageCircle,
  FileText,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  avatar: string | null;
  email: string | null;
  robloxUsername: string | null;
  robloxAvatar: string | null;
  isSiteAdmin: boolean;
  applicationsCount: number;
  createdAt: string;
  supportMode: {
    isActive: boolean;
    code: string | null;
    expiresAt: string | null;
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
        setRobloxSuccess("Roblox account updated successfully!");
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading your account settings...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
        <p className="text-xs text-slate-400 mb-6">
          Log in with Discord to access account settings, link your Roblox profile, and manage support mode.
        </p>
        <a
          href="/api/auth/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
        >
          <span>Login with Discord</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Account & Security Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your Discord profile, link your Roblox creator identity, and enable temporary support session codes.
        </p>
      </div>

      {/* Grid: Discord & Roblox Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Discord Account Info */}
        <div className="glass-panel p-6 rounded-2xl border border-surface-border space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Discord Identity</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
              OAuth2 Verified
            </span>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
              alt={profile.username}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/30 shadow-lg"
            />
            <div>
              <h4 className="text-base font-bold text-white">{profile.username}</h4>
              <p className="text-[11px] text-slate-400 font-mono">ID: {profile.id}</p>
              {profile.email && (
                <p className="text-[11px] text-slate-400 mt-0.5">{profile.email}</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <a
              href="/api/auth/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all border border-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh / Relink Discord Profile</span>
            </a>
            <p className="text-[10px] text-slate-500 text-center mt-1.5">
              Updates your avatar and username from Discord without losing data.
            </p>
          </div>
        </div>

        {/* Card 2: Linked Roblox Profile */}
        <div className="glass-panel p-6 rounded-2xl border border-surface-border space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Roblox Developer Profile</h3>
            </div>
            {profile.robloxUsername && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Linked
              </span>
            )}
          </div>

          <form onSubmit={handleSaveRoblox} className="space-y-4">
            {robloxSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {robloxSuccess}
              </div>
            )}

            <div className="flex items-center gap-4">
              {profile.robloxAvatar ? (
                <img
                  src={profile.robloxAvatar}
                  alt={profile.robloxUsername || "Roblox"}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/30 bg-black/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-surface border border-surface-border flex items-center justify-center text-slate-500 text-xs">
                  No Avatar
                </div>
              )}
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Roblox Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. Builderman"
                  value={robloxInput}
                  onChange={(e) => setRobloxInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingRoblox}
              className="w-full px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-md shadow-violet-600/30"
            >
              {savingRoblox ? "Linking..." : "Save Roblox Profile"}
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 2: 10-MINUTE SUPPORT MODE */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">10-Minute Support Mode</h3>
              <p className="text-xs text-slate-400">
                Grant temporary diagnostic access to RoFlow support staff to troubleshoot your account or community.
              </p>
            </div>
          </div>
          {supportCode ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse self-start sm:self-auto">
              Active Support Code
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
                  Share this temporary code with RoFlow staff in your ticket:
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
                Staff will never ask for your Discord password. Only share this 1-time code.
              </p>
              <button
                onClick={handleRevokeSupportCode}
                disabled={revokingCode}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium transition-all"
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
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 shrink-0"
            >
              {generatingCode ? "Generating..." : "Generate 10-Min Support Code"}
            </button>
          </div>
        )}

        {/* Official Support Server Link Card */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs font-bold text-white">RoFlow Community & Support Discord</p>
              <p className="text-[11px] text-slate-400">Server ID: 1565063649679122684</p>
            </div>
          </div>
          <a
            href="https://discord.gg/ZSGBbyEnWA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
          >
            <span>Join Support Server</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* SECTION 3: STAFF SUPPORT CODE LOGIN (For staff helping users) */}
      <div className="glass-panel p-6 rounded-2xl border border-surface-border space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Staff Member? Enter a Ticket Support Code</h3>
        </div>
        <p className="text-xs text-slate-400">
          If an applicant or community lead gave you their 10-minute code in a ticket, enter it below to begin a diagnostic session.
        </p>

        <form onSubmit={handleStaffLoginWithCode} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. RF-8921-4472"
            value={staffCodeInput}
            onChange={(e) => setStaffCodeInput(e.target.value.toUpperCase())}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-surface-border text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={staffLoggingIn}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-violet-600/30 shrink-0"
          >
            {staffLoggingIn ? "Authenticating..." : "Start Support Session"}
          </button>
        </form>

        {staffError && (
          <p className="text-xs text-rose-400 font-medium">{staffError}</p>
        )}
      </div>
    </div>
  );
}
