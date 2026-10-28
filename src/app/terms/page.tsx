import React from "react";
import Link from "next/link";
import { Shield, FileText, ArrowLeft, CheckCircle2, AlertTriangle, Mail, ExternalLink, Scale, Clock } from "lucide-react";

export default function TermsOfServicePage() {
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
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Terms of Service</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Official User Agreement • Governing Platform Usage
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

        {/* Non-Affiliation Box */}
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">Important Legal Notice & Platform Independence:</span>
          <p className="text-slate-400 leading-relaxed">
            RoleFlow (<code className="text-purple-300">roleflow.site</code>) is an independent, third-party software-as-a-service (SaaS) platform built for community staff recruitment and workflow automation. RoleFlow is <strong>NOT</strong> affiliated with, endorsed by, authorized by, or sponsored by Discord Inc. or Roblox Corporation.
          </p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, registering for, or using the RoleFlow web portal (<code className="text-purple-300">roleflow.site</code>), official Discord bot applications, APIs, or related services (collectively, the &quot;Service&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not accept these Terms in full, you must discontinue all use of the Service immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">2</span>
              <span>Eligibility & Account Security</span>
            </h2>
            <p>
              To use RoleFlow, you must be at least 13 years old (or the minimum legal age required in your jurisdiction to consent to online services, including Discord and Roblox Terms of Service). Authentication is conducted via official Discord OAuth2. You are solely responsible for all actions taken through your authenticated credentials.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li>You agree to supply truthful, accurate, and current information when linking profiles or submitting applications.</li>
              <li>You may not share or transfer your session credentials or facilitate unauthorized access to private community dashboards.</li>
              <li>If you discover any unauthorized use of your account or potential security vulnerability, you must notify us immediately at <span className="text-purple-400 font-mono">support@roleflow.site</span>.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">3</span>
              <span>Community Owners & Administrator Responsibilities</span>
            </h2>
            <p>
              Users who create, initialize, or administer communities on RoleFlow (&quot;Community Owners&quot;) agree to the following obligations:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="font-bold text-white block">Lawful Authority</span>
                <p className="text-slate-400">You must hold authorized server ownership or administrator authority in the associated Discord guild and Roblox groups.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="font-bold text-white block">No Prohibited Questioning</span>
                <p className="text-slate-400">You may never request passwords, personal government IDs, physical home addresses, or financial details on custom forms.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="font-bold text-white block">Bot Token Integrity</span>
                <p className="text-slate-400">Tokens provided for custom white-label bots must be legitimate and adhere strictly to the Discord Developer Terms of Service.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="font-bold text-white block">Fair Review Process</span>
                <p className="text-slate-400">You agree not to use automated systems or review queues to harass, discriminate against, or defraud applicants.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">4</span>
              <span>Candidate Applications & Submissions</span>
            </h2>
            <p>
              When submitting candidate forms to a community via RoleFlow:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li>You grant the target community&apos;s verified reviewers a non-exclusive license to review and evaluate your submitted answers and linked portfolios.</li>
              <li>RoleFlow serves exclusively as the software pipeline; hiring, promotion, and acceptance decisions rest solely with each respective community.</li>
              <li>Plagiarized answers, stolen development assets, or spam submissions may result in global platform blacklisting.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">5</span>
              <span>10-Minute Support Mode & Diagnostic Authorization</span>
            </h2>
            <p>
              RoleFlow features a 10-Minute Support Mode enabling members to generate a temporary single-use code (<code className="text-purple-300 font-mono">RF-XXXX-XXXX</code>). By generating and providing this code to RoleFlow verified support staff:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li>You explicitly grant designated staff temporary, read-write diagnostic delegation to inspect configuration glitches on your behalf.</li>
              <li>Support codes automatically expire after exactly ten (10) minutes or may be revoked immediately by you at any time.</li>
              <li>RoleFlow staff will never request passwords, private cryptographic keys, or payment credentials.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">6</span>
              <span>Suspension, Termination & Global Blacklisting</span>
            </h2>
            <p>
              Platform administrators reserve the unilateral right to suspend, pause, or permanently delete communities, and globally blacklist user accounts that violate our policies, engage in deceptive behavior, or compromise platform integrity.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">7</span>
              <span>License Keys, Community Subscriptions & Refund Terms</span>
            </h2>
            <p>
              RoleFlow offers promotional, tiered, and permanent license keys for community workspaces. License keys are tied to the redeemed community server and may not be resold, transferred, or exploited via automated key farming. Unless explicitly required by mandatory consumer protection law, all digital license redemptions are non-refundable once activated.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">8</span>
              <span>Service Availability, Uptime & Scheduled Maintenance</span>
            </h2>
            <p>
              While RoleFlow strives for 99.9% uptime, we reserve the right to temporarily pause public access for emergency patches, infrastructure migrations, and scheduled maintenance. Administrators and verified support staff may retain access during maintenance windows to conduct quality assurance. RoleFlow is not financially liable for any temporary service interruptions or communication delays resulting from scheduled maintenance.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">9</span>
              <span>Intellectual Property & Custom Position Content</span>
            </h2>
            <p>
              Community managers retain ownership of the original text, examination questions, and criteria written within their job listings. By publishing openings on RoleFlow, community owners grant RoleFlow a worldwide, royalty-free license to host, display, and cache such content to facilitate applicant evaluation and public listing directory discovery.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">10</span>
              <span>Limitation of Liability & Warranty Disclaimer</span>
            </h2>
            <p>
              The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express, statutory, or implied. To the maximum extent permitted by applicable law, RoleFlow, its founders, and its contributors disclaim all liability for indirect, punitive, incidental, or consequential damages arising from service downtime, data loss, recruitment decisions made by independent guilds, or actions taken by third-party platforms including Discord and Roblox.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono flex items-center justify-center text-purple-400">11</span>
              <span>Governing Law & Dispute Resolution</span>
            </h2>
            <p>
              These Terms and any non-contractual obligations arising out of or in connection with them shall be governed by and construed in accordance with applicable governing law. Any disputes or claims shall first be submitted to informal resolution by contacting our designated support team at <code className="text-purple-300">support@roleflow.site</code> before initiating any formal tribunal proceedings.
            </p>
          </section>

          {/* Section 12: Contact */}
          <section className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block">Legal Inquiries & Official Support</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Questions regarding these Terms should be sent to our official support team.
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
