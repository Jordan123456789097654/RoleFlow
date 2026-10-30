import React from "react";
import Link from "next/link";

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Platform",
    links: [
      { href: "/browse", label: "Browse openings" },
      { href: "/polls", label: "Polls" },
      { href: "/docs", label: "Documentation" },
      { href: "/my-applications", label: "My applications" },
      { href: "/dashboard", label: "Community dashboard" },
      { href: "/settings", label: "Account & support" },
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
    <footer className="mt-24 border-t border-line">
      <div className="page-wrap py-14">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="space-y-5 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-7 w-7 rounded-md" />
              <span className="font-display text-[19px] font-semibold text-ink">RoleFlow</span>
            </div>
            <p className="max-w-sm text-[15px] leading-relaxed text-muted">
              The modern way to run staff applications, developer openings and community recruitment, without drowning in Discord DMs.
            </p>
            <a
              href="https://discord.gg/tKPbCXbmr9"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost btn-sm"
            >
              Support Discord ↗
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-7">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="eyebrow mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-[12px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">© {new Date().getFullYear()} RoleFlow · roleflow.site</p>
          <p className="max-w-xl sm:text-right">
            RoleFlow is an independent recruitment platform and is not affiliated with, endorsed by, or sponsored by Discord Inc. or Roblox Corporation.
          </p>
        </div>
      </div>
    </footer>
  );
}
