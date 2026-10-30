import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import Link from "next/link";
import { Shield, Sparkles, ArrowLeft, Users, Clock, FileCheck } from "lucide-react";
import { RosterGroupConnectManager } from "@/components/roster/RosterGroupConnectManager";

export const dynamic = "force-dynamic";

export default async function RosterPlaceholderPage() {
  const user = await getCurrentUser();

  // Strict check: if flag is off and user is not allowlisted, render standard 404
  if (!canAccessRoster({ userId: user?.id })) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col justify-between selection:bg-violet-600/40">
      {/* Background radial atmosphere */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(90,42,162,0.45)_0%,rgba(67,29,130,0.2)_40%,transparent_70%)] blur-[90px]" />

      {/* Internal Navigation Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#08090f]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to RoleFlow</span>
            </Link>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">Roster by RoleFlow</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                STAGES 2 &amp; 3 PREVIEW &bull; UNRELEASED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Allowlist: {user?.username || user?.id || "Authorized Preview"}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center space-y-8 my-auto w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/60 px-4 py-1.5 text-xs font-semibold text-[#ddd6fe] shadow-[0_0_20px_rgba(90,42,162,0.35)] backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span>Stage 2 &amp; 3: Data Model &amp; Group Import Ready</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Staff &amp; Operations Management for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-white via-[#ddd6fe] to-[#8b5cf6] bg-clip-text text-transparent">
            Roblox Groups.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
          Connect your Roblox group to verify permissions, review members and ranks, and import your staff directory with zero manual hassle.
        </p>

        {/* Workflow 4.1: Group Connect & Import UI */}
        <div className="pt-2 text-left">
          <RosterGroupConnectManager />
        </div>

        {/* Feature Overview Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md space-y-2">
            <Users className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-sm text-white">Staff Roster Directory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time member lists, Roblox ranks, custom teams, and status indicators.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md space-y-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Audited Actions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Formal moderation logs with strict 24-hour edit windows and immutable history.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md space-y-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Shifts &amp; Training</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Activity session tracking, checklists, and automated 7/30/90-day reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500 font-mono">
        Roster by RoleFlow &bull; Stages 2 &amp; 3 &bull; Confidential &amp; Unreleased
      </footer>
    </div>
  );
}
