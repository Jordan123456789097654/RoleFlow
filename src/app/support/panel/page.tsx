"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowLeft,
  KeyRound,
  Eye,
  RefreshCw,
  Mail,
} from "lucide-react";

interface ActiveSessionUser {
  id: string;
  username: string;
  avatar: string | null;
  supportCode: string;
  expiresInMinutes: number;
}

export default function SupportStaffPanelPage() {
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionUser[]>([]);
  const [codeQuery, setCodeQuery] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetResults, setResetResults] = useState<Record<string, { ok: boolean; text: string }>>({});

  useEffect(() => {
    fetchActiveSessions();
    fetchMaintenanceState();
  }, []);

  async function fetchMaintenanceState() {
    try {
      const res = await fetch("/api/admin/maintenance");
      if (res.ok) {
        const data = await res.json();
        setMaintenanceEnabled(data.enabled || false);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceEnabled;
    const confirmMsg = nextState
      ? "Enable platform MAINTENANCE MODE? All non-staff visitors will see the maintenance screen."
      : "Disable maintenance mode and open RoleFlow to the public?";
    if (!confirm(confirmMsg)) return;

    setTogglingMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceEnabled(data.enabled);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingMaintenance(false);
    }
  };

  async function fetchActiveSessions() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/support/active-sessions");
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data.activeSessions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleSendReset = async (session: ActiveSessionUser) => {
    if (!confirm(`Email a password reset link to ${session.username}? The link goes to the address on their account and expires in 1 hour.`)) return;
    setResettingId(session.id);
    try {
      const res = await fetch("/api/support/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.id }),
      });
      const data = await res.json().catch(() => ({}));
      setResetResults((prev) => ({
        ...prev,
        [session.id]: res.ok ? { ok: true, text: data.message || "Reset link sent." } : { ok: false, text: data.error || "Could not send reset." },
      }));
    } catch {
      setResetResults((prev) => ({ ...prev, [session.id]: { ok: false, text: "Network error." } }));
    } finally {
      setResettingId(null);
    }
  };

  const handleStartSession = async (codeToUse: string) => {
    if (!codeToUse.trim()) return;
    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/support/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToUse.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
      } else {
        setLoginError(data.error || "Failed to start diagnostic session");
      }
    } catch (e: any) {
      setLoginError(e.message || "Network error occurred");
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-28 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs text-muted font-mono">Authenticating RoleFlow Support Specialist Credentials...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-danger">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Support Staff Access Required</h2>
        <p className="text-xs text-muted mb-6 leading-relaxed">
          This panel is restricted exclusively to verified RoleFlow Support Specialists and platform administrators. If you are a support team member, please ask the Founder to grant you the Support Staff role in the Admin Console.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-surface hover:bg-sunk text-xs font-semibold text-ink transition-all border border-line"
          >
            Back to Dashboard
          </Link>
          <a
            href="https://discord.gg/tKPbCXbmr9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all"
          >
            <span>Staff Discord</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-accent border border-purple-500/30">
              INTERNAL STAFF ONLY
            </span>
            <span className="text-xs text-faint font-mono">• SLA Priority Desk</span>
          </div>
          <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-accent" />
            <span>Support Staff Command Center</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            Perform 10-minute diagnostic sessions, inspect member account issues, and resolve ticket escalations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Maintenance Mode Toggle Button */}
          <button
            onClick={handleToggleMaintenance}
            disabled={togglingMaintenance}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              maintenanceEnabled
                ? "bg-rose-500/10 text-danger border-rose-500/30"
                : "bg-surface border-line text-muted hover:text-ink hover:border-line-strong"
            }`}
            title="Toggle Platform-Wide Maintenance Mode"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{maintenanceEnabled ? "Maintenance ACTIVE" : "Maintenance: OFF"}</span>
          </button>

          <Link
            href="/feedback"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-xs font-semibold text-accent transition-all border border-purple-500/30"
          >
            <span>Bug & Feedback Desk</span>
          </Link>

          <button
            onClick={fetchActiveSessions}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-sunk text-xs font-semibold text-ink-2 transition-all border border-line"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CODE INPUT BOX */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-500/30 bg-accent-soft space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent" />
          <h3 className="text-base font-bold text-ink">Start Diagnostic Session via 10-Minute Code</h3>
        </div>
        <p className="text-xs text-muted">
          Paste the temporary single-use code provided by the community lead or member in your Discord ticket.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStartSession(codeQuery);
          }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="e.g. RF-8921-4472"
              value={codeQuery}
              onChange={(e) => setCodeQuery(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-line-strong text-sm text-ink placeholder-faint font-mono tracking-wider focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loggingIn || !codeQuery.trim()}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-card shrink-0 disabled:bg-sunk disabled:text-faint disabled:border disabled:border-line disabled:shadow-none disabled:cursor-not-allowed"
          >
            {loggingIn ? "Connecting..." : "Initiate Diagnostic Session"}
          </button>
        </form>

        {loginError && (
          <p className="text-xs text-danger font-medium flex items-center gap-1.5 pt-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </p>
        )}
      </div>

      {/* SECTION 2: LIVE ACTIVE TICKETS / CODES WAITING FOR SUPPORT */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-line space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              <span>Active User Support Codes Awaiting Assistance</span>
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Members who recently clicked &ldquo;Generate 10-Minute Support Code&rdquo; from their settings page.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sunk border border-line text-ink-2">
            {activeSessions.length} Active
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-paper border border-dashed border-line-strong space-y-2">
            <CheckCircle2 className="w-8 h-8 text-moss mx-auto" />
            <h4 className="text-xs font-bold text-ink">No Pending Support Codes</h4>
            <p className="text-[11px] text-muted max-w-sm mx-auto">
              No users currently have an active 10-minute diagnostic token. When a member generates a code in a ticket, it will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-2xl bg-paper border border-line hover:border-purple-500/40 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={session.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                    alt={session.username}
                    className="w-12 h-12 rounded-xl object-cover border border-line"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-ink">{session.username}</h4>
                    <p className="text-[11px] font-mono text-accent font-bold">{session.supportCode}</p>
                    <p className="text-[10px] text-gold font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Expires in ~{session.expiresInMinutes}m</span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendReset(session)}
                      disabled={resettingId === session.id}
                      className="btn-ghost btn-sm"
                      title="Email the member a password reset link"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{resettingId === session.id ? "Sending..." : "Send reset link"}</span>
                    </button>
                    <button
                      onClick={() => handleStartSession(session.supportCode)}
                      className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>Diagnose</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {resetResults[session.id] && (
                    <span className={resetResults[session.id].ok ? "text-[11px] text-moss" : "text-[11px] text-danger"}>
                      {resetResults[session.id].text}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: STAFF SUPPORT GUIDELINES */}
      <div className="p-5 rounded-2xl bg-surface border border-line space-y-3">
        <h4 className="text-xs font-bold text-ink-2 uppercase font-mono tracking-wider">
          Staff Operational Protocols
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted">
          <div className="p-3 rounded-xl bg-paper border border-line">
            <span className="font-bold text-ink block mb-1">1. Respect Member Privacy</span>
            Never alter positions or form settings without explicit ticket instructions from the community owner.
          </div>
          <div className="p-3 rounded-xl bg-paper border border-line">
            <span className="font-bold text-ink block mb-1">2. 10-Minute Timeframe</span>
            Sessions expire automatically after 10 minutes. Advise members to generate a new code if more time is required.
          </div>
          <div className="p-3 rounded-xl bg-paper border border-line">
            <span className="font-bold text-ink block mb-1">3. Security Zero-Tolerance</span>
            Staff members will never ask for user passwords or OAuth tokens under any circumstances.
          </div>
        </div>
      </div>
    </div>
  );
}
