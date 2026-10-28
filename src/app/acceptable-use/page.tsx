import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

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

      <div className="border border-white/10 rounded-2xl bg-surface/80 backdrop-blur-xl p-8 sm:p-12 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Acceptable Use Policy</h1>
            <p className="text-xs text-slate-400">Community rules, anti-abuse standards, and platform integrity</p>
          </div>
        </div>

        <div className="prose prose-invert prose-purple max-w-none space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Purpose & Standards</h2>
            <p>
              To keep RoleFlow a trusted ecosystem for gaming communities, Roblox creators, and applicants, all users, communities, and custom bots must adhere to this Acceptable Use Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Prohibited Conduct for Applicants</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span><strong>Plagiarism & Stolen Portfolios:</strong> Submitting assets, script showcases, or answers copied from other developers or claiming credit for another user&apos;s work.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span><strong>Spamming & Cooldown Evasion:</strong> Using alternate Discord accounts to bypass rejection cooldowns or flooding forms with nonsensical text.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span><strong>Malicious Links:</strong> Inserting phishing links, token loggers, or unauthorized executables into portfolio fields.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Prohibited Conduct for Community Admins</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span><strong>Harvesting Sensitive Data:</strong> Creating questions requesting passwords, personal identification numbers, real-life home addresses, or financial data.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span><strong>Malicious Role Grants:</strong> Misusing auto-role assignment to bypass server safety perimeters.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span><strong>Discriminatory Hiring:</strong> Discriminating against applicants based on protected characteristics in violation of law.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Enforcement & Verified Badge Revocation</h2>
            <p>
              Site administrators reserve the right to ban offending users, shut down abusive community portals, and revoke **Verified Badges** for any violation of these rules. Reports can be submitted to <span className="text-rose-400">abuse@roleflow.site</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
