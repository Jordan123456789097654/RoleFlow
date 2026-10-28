import React from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Eye, ShieldCheck, Database } from "lucide-react";

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

      <div className="border border-white/10 rounded-2xl bg-surface/80 backdrop-blur-xl p-8 sm:p-12 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-xs text-slate-400">Last updated: October 2026 • Your privacy and data rights matter</p>
          </div>
        </div>

        <div className="prose prose-invert prose-purple max-w-none space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Overview & Commitment</h2>
            <p>
              RoleFlow (&quot;we&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy details what personal information we collect, why we collect it, how it is used, and your options regarding data deletion and control. We do not sell your personal data to third parties or advertising networks.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Information We Collect</h2>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-semibold text-white block mb-1">Discord Profile Information</span>
                <p className="text-xs text-slate-400">
                  When you authenticate via Discord OAuth2, we receive your Discord User ID, username, discriminator, and avatar hash. This is used solely to authenticate your identity and link your applications.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-semibold text-white block mb-1">Application Questionnaire Responses</span>
                <p className="text-xs text-slate-400">
                  The answers, text, portfolio links, and files you provide when submitting an application to a specific community are securely stored and made accessible only to that community&apos;s verified reviewers.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-semibold text-white block mb-1">Roblox Account Identifiers (Optional)</span>
                <p className="text-xs text-slate-400">
                  If you or a community enables Roblox verification, we retrieve your public Roblox User ID and username to verify developer credentials.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <span className="font-semibold text-white block mb-1">Local Browser Drafts</span>
                <p className="text-xs text-slate-400">
                  To prevent losing your typed answers before submitting, answers are automatically backed up in your browser&apos;s local storage (`localStorage`). This data never leaves your device until you press Submit.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. How Your Information Is Shared</h2>
            <p>
              Your application answers are visible <strong>only</strong> to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Yourself (via your personal &quot;My Applications&quot; dashboard).</li>
              <li>The verified staff and administrators of the community you submitted the application to.</li>
              <li>Automated Discord notification webhooks configured by the community&apos;s staff channel.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Data Retention & Right to Deletion</h2>
            <p>
              Under GDPR and international privacy regulations, you retain the right to access, rectify, or request deletion of your stored application records. You can withdraw active applications at any time from the &quot;My Applications&quot; hub, or contact <span className="text-purple-400">privacy@roleflow.site</span> for complete data erasure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Security Measures</h2>
            <p>
              We implement industry-standard encryption in transit (HTTPS/TLS) and secure database access policies. Bot tokens provided by custom server admins are stored encrypted and never exposed to unauthorized parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
