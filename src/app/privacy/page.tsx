import React from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Eye, ShieldCheck, Database, Mail, CheckCircle2, FileText, UserCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Privacy Policy</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Data Protection, Collection Standards & GDPR/CCPA Compliance
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              VERSION 2.4
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-white/5 text-slate-300 border border-white/10">
              Effective: October 2026
            </span>
          </div>
        </div>

        {/* Commitment Statement */}
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">Our Core Privacy Commitment:</span>
          <p className="text-slate-400 leading-relaxed">
            RoleFlow operates under a zero-monetization-of-personal-data rule. We do <strong>NOT</strong> sell, rent, monetize, or broker your personal information to third-party advertisers, data aggregators, or marketing firms under any circumstance.
          </p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">1</span>
              <span>Information We Collect & Sources</span>
            </h2>
            <p>
              We collect information strictly necessary to provide recruitment workflows and Discord server automation:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Discord OAuth2 Data</span>
                <p className="text-slate-400">
                  When you sign in using Discord, we collect your public Discord User ID, username, discriminator, verified email address, and avatar image hash. We never receive or request your Discord password.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Application Questionnaire Responses</span>
                <p className="text-slate-400">
                  Information you voluntarily submit in candidate forms (responses, portfolio links, and attachments). This information is visible exclusively to you and the designated staff of that specific community.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Roblox Creator Identifiers</span>
                <p className="text-slate-400">
                  When linking a Roblox account, we query public Roblox endpoints (<code className="text-purple-300">users.roblox.com</code>) to display your public 3D avatar and verify group membership ranks. We never collect passwords or .ROBLOSECURITY cookies.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="font-bold text-white block">Client-Side Draft Storage</span>
                <p className="text-slate-400">
                  To prevent lost answers during typing, application responses are temporarily cached in your browser&apos;s local memory (<code className="text-purple-300">localStorage</code>) and never transmitted until you press Submit.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: How We Use Data */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">2</span>
              <span>How We Use Your Information</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li>To authenticate your identity across community application portals without requiring duplicate account creation.</li>
              <li>To deliver candidate submissions directly to authorized community reviewers in web queues and Discord alert channels.</li>
              <li>To execute automated Discord server role assignment and application status notification direct messages upon candidate acceptance.</li>
              <li>To enforce anti-spam protections, re-application cooldowns, and prevent abusive bot submissions.</li>
            </ul>
          </section>

          {/* Section 3: Data Sharing & Disclosures */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">3</span>
              <span>Data Sharing & Third-Party Services</span>
            </h2>
            <p>
              We do not share your data except with authorized service infrastructure required to deliver RoleFlow:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li><strong>Target Community Reviewers:</strong> Authorized server administrators and staff of the communities you apply to.</li>
              <li><strong>Discord API:</strong> To verify guild memberships, send direct messages, and assign roles via Discord REST endpoints.</li>
              <li><strong>Hosting & Database Infrastructure:</strong> Encrypted cloud database infrastructure hosted within secure enterprise-grade data centers.</li>
            </ul>
          </section>

          {/* Section 4: GDPR & CCPA Rights */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">4</span>
              <span>Your Data Rights (GDPR & CCPA Compliance)</span>
            </h2>
            <p>
              Regardless of your geographical location, RoleFlow provides comprehensive data rights:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Right to Access</span>
                View all your active and historic applications in your personal &quot;My Applications&quot; dashboard.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Right to Rectify</span>
                Update linked Roblox accounts and sync updated Discord avatars from your settings at any time.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold text-white block mb-1">Right to Erasure</span>
                Request complete account and application data purge by emailing our data team.
              </div>
            </div>
          </section>

          {/* Section 5: Security Standards */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">5</span>
              <span>Security & Encryption Standards</span>
            </h2>
            <p>
              All traffic between your browser and RoleFlow is encrypted using TLS 1.3/HTTPS. Authentication sessions utilize encrypted HTTP-only cookies protected with strict SameSite flags. Bot tokens and confidential integration parameters are stored securely and never transmitted to the client.
            </p>
          </section>

          {/* Contact Section */}
          <section className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block">Privacy Officer & Data Deletion Requests</span>
              <p className="text-xs text-slate-400 mt-0.5">
                To request data export or complete account purge, contact our privacy desk.
              </p>
            </div>
            <a
              href="mailto:support@roleflow.site"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
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
