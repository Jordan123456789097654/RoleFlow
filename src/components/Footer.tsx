import React from "react";
import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Platform",
    links: [
      { href: "/browse", label: "Browse openings" },
      { href: "/my-applications", label: "My applications" },
      { href: "/dashboard", label: "Community dashboard" },
      { href: "/marketplace", label: "Template marketplace" },
      { href: "/settings", label: "Account & support" },
      { href: "/billing", label: "Billing" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/acceptable-use", label: "Acceptable Use" },
      { href: "/community-guidelines", label: "Community Guidelines" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.07] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-[10px] overflow-hidden ring-1 ring-white/10">
                <img src="/logo.png" alt="" className="w-full h-full object-cover" />
              </span>
              <span className="font-display text-lg font-bold text-white">RoleFlow</span>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed max-w-sm">
              The modern way to run staff applications, developer openings and community recruitment, without drowning in Discord DMs.
            </p>
            <a
              href="https://discord.gg/tKPbCXbmr9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-white/10 bg-white/[0.03] text-[13px] font-medium text-slate-200 hover:bg-white/[0.07] hover:border-white/20 transition"
            >
              <MessageCircle className="w-4 h-4 text-violet-300" />
              Support Discord
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[13px] text-slate-300 hover:text-white transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px] text-slate-500">
          <p>© {new Date().getFullYear()} RoleFlow · roleflow.site</p>
          <p className="max-w-xl sm:text-right">
            RoleFlow is an independent recruitment platform and is not affiliated with, endorsed by, or sponsored by Discord Inc. or Roblox Corporation.
          </p>
        </div>
      </div>
    </footer>
  );
}
