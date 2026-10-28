import React from "react";
import Link from "next/link";
import { Shield, Sparkles, ExternalLink, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-border/60 bg-surface/50 mt-24 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-surface-border/40 border border-white/10 p-0.5 shadow-md">
                <img src="/logo.png" alt="RoleFlow Logo" className="w-full h-full object-contain rounded-md" />
              </div>
              <span className="text-lg font-bold text-white">RoleFlow</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The modern way to manage staff applications, Roblox developer openings, and community recruitment without drowning in Discord DMs.
            </p>
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>roleflow.site • All Systems Operational</span>
            </div>
          </div>

          {/* Communities & Applicants */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/browse" className="hover:text-purple-300 transition-colors">
                  Browse Openings
                </Link>
              </li>
              <li>
                <Link href="/my-applications" className="hover:text-purple-300 transition-colors">
                  My Applications Hub
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-purple-300 transition-colors">
                  Community Dashboard
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-purple-300 transition-colors">
                  Account Settings & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Support Discord */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Community & Support
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://discord.gg/ZSGBbyEnWA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>RoleFlow Support Discord</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-slate-400">Hosted Server Automation</span>
              </li>
              <li>
                <span className="text-slate-400">Roblox Identity Verification</span>
              </li>
              <li>
                <span className="text-slate-400">10-Minute Support Mode</span>
              </li>
            </ul>
          </div>

          {/* Legal Compliance */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/terms" className="hover:text-purple-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-purple-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="hover:text-purple-300 transition-colors">
                  Acceptable Use Policy
                </Link>
              </li>
              <li>
                <span className="text-slate-500">GDPR & Discord Developer Compliant</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RoleFlow (roleflow.site). Built for high-growth Discord communities and studios.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-400">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
            <Link href="/acceptable-use" className="hover:text-slate-400">Acceptable Use</Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-center text-[10px] text-slate-600">
          RoleFlow is an independent recruitment platform and is not affiliated with, endorsed by, or sponsored by Discord Inc. or Roblox Corporation.
        </div>
      </div>
    </footer>
  );
}
