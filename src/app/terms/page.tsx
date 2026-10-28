import React from "react";
import Link from "next/link";
import { Shield, FileText, ArrowLeft, CheckCircle } from "lucide-react";

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

      <div className="border border-white/10 rounded-2xl bg-surface/80 backdrop-blur-xl p-8 sm:p-12 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms of Service</h1>
            <p className="text-xs text-slate-400">Last updated: October 2026 • Effective Immediately</p>
          </div>
        </div>

        <div className="prose prose-invert prose-purple max-w-none space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using RoleFlow (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;), including our website at roleflow.site, Discord application bot (&quot;RoleFlow Bot&quot;), API endpoints, and associated services, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Description of the Service</h2>
            <p>
              RoleFlow provides a cloud-based recruitment and application lifecycle management platform for Discord server communities, gaming studios, esports organizations, and content creators. The Service enables authorized community administrators to design customized application forms, solicit submissions, review candidate applications, manage staff workflows, and integrate automated Discord server actions (including notifications and automated role assignment).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. User Accounts and Discord Authentication</h2>
            <p>
              Authentication is conducted securely through Discord OAuth2. You are responsible for maintaining the confidentiality and security of your Discord account. You agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>You will not impersonate any person or entity, or falsely claim affiliation with any Discord guild or studio.</li>
              <li>You will not use automated scripts, scrapers, or unauthorized bots to mass-submit fake or abusive applications.</li>
              <li>You comply with Discord&apos;s own Terms of Service and Community Guidelines at all times while using RoleFlow.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Community Administrators and Custom Bots</h2>
            <p>
              Community administrators who connect their Discord guilds or input custom Discord Bot Tokens (&quot;White-Label Mode&quot;) agree to the following:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>You possess lawful authority (e.g. Administrator or Server Owner permissions) to connect the guild and configure roles.</li>
              <li>Any custom Discord bot token provided to RoleFlow is stored securely and solely utilized to dispatch notifications, interview tickets, and role updates on your community&apos;s behalf.</li>
              <li>You remain solely responsible for the content of your application questionnaires, evaluation criteria, and staff decisions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Applicant Submissions & Confidentiality</h2>
            <p>
              When submitting an application to a community via RoleFlow:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>All information provided must be truthful and accurate to the best of your knowledge.</li>
              <li>You grant the target community&apos;s designated staff members permission to review your responses, Discord identifier, and linked gaming profiles (e.g., Roblox).</li>
              <li>RoleFlow is an intermediary tool; hiring, moderation, or acceptance decisions rest solely with each respective community.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, RoleFlow and its maintainers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or reputation resulting from: (a) unauthorized access to or alteration of your submissions; (b) actions or disputes arising between community owners and applicants; (c) downtime or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Contact & Inquiries</h2>
            <p>
              If you have any questions regarding these Terms of Service, please reach out to our team at{" "}
              <span className="text-purple-400 font-medium">legal@roleflow.site</span> or via our official Discord support server.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
