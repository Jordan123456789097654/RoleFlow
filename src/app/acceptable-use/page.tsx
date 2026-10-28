import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle, ShieldAlert, Mail, Ban, Lock } from "lucide-react";

export default function AcceptableUsePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to RoleFlow Home
      </Link>

      <div className="border border-white/10 rounded-3xl bg-surface/90 backdrop-blur-xl p-8 sm:p-12 shadow-2xl space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Acceptable Use Policy</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Anti-Abuse Standards, Platform Integrity & Prohibited Activities
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              ANTI-ABUSE DIRECTIVE
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-white/5 text-slate-300 border border-white/10">
              Effective: October 2026
            </span>
          </div>
        </div>

        {/* Introduction */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">Zero-Tolerance Anti-Abuse Standards:</span>
          <p className="text-slate-400 leading-relaxed">
            RoleFlow is engineered to empower trustworthy Discord communities and Roblox creators. We maintain a zero-tolerance policy against credential harvesting, phishing, plagiarism, and harassment. Violations will result in immediate community suspension and global platform blacklisting.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1: Prohibited Activities for All Users */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-rose-400">1</span>
              <span>Prohibited Conduct for All Users</span>
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Phishing & Credential Solicitation</strong>
                  <span className="text-slate-400">Never input, request, or harvest account passwords, one-time verification tokens (2FA), Discord authorization codes, Roblox security cookies (.ROBLOSECURITY), or credit card credentials.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Malicious Links & Token Stealers</strong>
                  <span className="text-slate-400">Inserting links leading to token loggers, malicious executable files, Discord Nitro scams, or unauthorized third-party redirectors is strictly prohibited and immediately reported.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Automated Flooding & Form Scraping</strong>
                  <span className="text-slate-400">Using automated headless bots, request scrapers, or botnets to mass-submit synthetic or spam application forms to community portals.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Prohibited Conduct for Applicants */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-rose-400">2</span>
              <span>Applicant Integrity & Portfolio Standards</span>
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Asset Plagiarism & Stolen Portfolios</strong>
                  <span className="text-slate-400">Submitting Roblox 3D models, Luau code showcases, graphics, or moderation resumes crafted by other developers while claiming original authorship.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Cooldown Evasion with Alternate Accounts</strong>
                  <span className="text-slate-400">Creating or authenticating secondary Discord accounts to circumvent rejection cooldown timers or server blacklists set by community owners.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Impersonation of Staff or Developers</strong>
                  <span className="text-slate-400">Falsely linking notable Roblox usernames or claiming official affiliation with Roblox Corporation or prominent development studios.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Prohibited Conduct for Community Admins */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-rose-400">3</span>
              <span>Community Lead & Administrator Standards</span>
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Inappropriate Questionnaire Prompts</strong>
                  <span className="text-slate-400">Community leads must not create questions requesting sensitive personal identifiable information (PII), national identification numbers, real-world residential addresses, or financial records.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Abusive Bot Automations</strong>
                  <span className="text-slate-400">Configuring automated acceptance actions to grant dangerous administrative roles or mass-ping server members in violation of Discord developer policies.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Enforcement & Global Blacklists */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-rose-400">4</span>
              <span>Investigation & Enforcement Actions</span>
            </h2>
            <p className="text-xs text-slate-400">
              RoleFlow platform administrators actively monitor submission logs and community activities. Confirmed violations of this policy result in:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li>Immediate revocation of official Partner and Verified Community badges.</li>
              <li>Administrative pausing or permanent deletion of community portals and application openings.</li>
              <li>Permanent global blacklisting of the offending Discord User ID and linked Roblox creator identities.</li>
            </ul>
          </section>

          {/* Reporting Section */}
          <section className="p-5 rounded-2xl bg-black/40 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block">Report Abuse or Malicious Portals</span>
              <p className="text-xs text-slate-400 mt-0.5">
                If you encounter a community or applicant violating this policy, notify our trust and safety desk immediately.
              </p>
            </div>
            <a
              href="mailto:support@roleflow.site"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@roleflow.site</span>
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
