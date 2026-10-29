"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, LayoutDashboard, Radio, Search, Settings, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  /** Path after /dashboard/[guildId]. Empty string is the overview. */
  suffix: string;
  icon: React.ComponentType<{ className?: string }>;
  manageOnly?: boolean;
};

const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ label: "Dashboard", suffix: "", icon: LayoutDashboard }] },
  {
    title: "People",
    items: [
      { label: "Staff roster", suffix: "/staff", icon: Users },
      { label: "Compliance", suffix: "/compliance", icon: ShieldCheck },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Live servers", suffix: "/live", icon: Radio },
      { label: "Scheduling", suffix: "/automation", icon: CalendarClock, manageOnly: true },
    ],
  },
  {
    title: "Configuration",
    items: [{ label: "Community settings", suffix: "/site", icon: Settings, manageOnly: true }],
  },
];

export function WorkspaceShell({
  guildId,
  guildName,
  guildIcon,
  canManage,
  children,
}: {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  canManage: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const base = `/dashboard/${guildId}`;

  const isActive = (item: NavItem) =>
    item.suffix === "" ? pathname === base : pathname.startsWith(base + item.suffix);

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items
      .filter((i) => canManage || !i.manageOnly)
      .filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter((g) => g.items.length > 0);

  const allItems = GROUPS.flatMap((g) => g.items).filter((i) => canManage || !i.manageOnly);
  const current = allItems.find(isActive)?.label ?? "Community";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-3 border-b border-line px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sunk">
            {guildIcon ? (
              <img src={guildIcon} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[12px] font-semibold text-ink-2">{guildName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">{guildName}</p>
            <p className="text-[12px] text-faint">Workspace</p>
          </div>
        </div>

        <div className="px-3 pt-3">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2">
            <Search className="h-3.5 w-3.5 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter pages"
              className="w-full bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
            />
          </label>
        </div>

        <nav className="flex-1 space-y-5 px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-faint">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={base + item.suffix}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] transition-colors",
                          active ? "bg-sunk font-medium text-ink" : "text-muted hover:bg-sunk hover:text-ink"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {visibleGroups.length === 0 && <p className="px-2 text-[13px] text-faint">No pages match.</p>}
        </nav>

        <div className="border-t border-line px-4 py-3">
          <Link href="/dashboard" className="text-[12px] text-faint hover:text-ink">← All communities</Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-8">
          <span className="truncate text-[13px] text-muted">{guildName}</span>
          <span className="text-[13px] text-faint">/</span>
          <span className="truncate text-[13px] font-medium text-ink">{current}</span>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 md:hidden">
          {allItems.map((item) => (
            <Link
              key={item.label}
              href={base + item.suffix}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-[13px]",
                isActive(item) ? "bg-sunk font-medium text-ink" : "text-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
