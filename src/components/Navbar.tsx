"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  FileText,
  LayoutDashboard,
  Shield,
  LifeBuoy,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    id: string;
    username: string;
    avatar: string | null;
    robloxUsername?: string | null;
    isSiteAdmin?: boolean;
    isSupportStaff?: boolean;
    siteRole?: string;
    hasCommunities?: boolean;
  } | null;
}

const FALLBACK_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
      const t = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable;
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        router.push("/browse");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const roleLabel =
    user?.siteRole === "FOUNDER"
      ? "Platform Founder"
      : user?.siteRole === "ADMIN" || user?.isSiteAdmin
      ? "Site Admin"
      : user?.siteRole === "MODERATOR"
      ? "Moderator"
      : user?.siteRole === "SUPPORT"
      ? "Support Staff"
      : user?.siteRole === "STAFF"
      ? "Staff"
      : user?.hasCommunities
      ? "Community Lead"
      : "Member";

  const links = [
    { href: "/browse", label: "Browse", icon: Compass, active: pathname === "/browse" },
    { href: "/marketplace", label: "Templates", icon: LayoutTemplate, active: pathname === "/marketplace" },
    ...(user ? [{ href: "/my-applications", label: "My applications", icon: FileText, active: pathname === "/my-applications" }] : []),
    ...(user?.hasCommunities ? [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: pathname.startsWith("/dashboard") }] : []),
  ];

  const isStaff = Boolean(user?.isSupportStaff || user?.isSiteAdmin);
  const avatar = user?.avatar || FALLBACK_AVATAR;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-background/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand + primary nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="RoleFlow home">
            <span className="relative w-8 h-8 rounded-[10px] overflow-hidden ring-1 ring-white/10 group-hover:ring-violet-400/60 transition">
              <img src="/logo.png" alt="" className="w-full h-full object-cover" />
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight text-white">RoleFlow</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={cn(
                  "relative px-3 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5",
                  l.active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                <l.icon className="w-3.5 h-3.5" />
                <span>{l.label}</span>
                {l.active && <span className="absolute inset-x-3 -bottom-[17px] h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />}
              </Link>
            ))}

            {isStaff && <span className="h-4 w-px bg-white/10 mx-2" />}
            {isStaff && (
              <Link
                href="/support/panel"
                title="Support console"
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 border transition-colors",
                  pathname.startsWith("/support/panel")
                    ? "text-cyan-200 bg-cyan-500/10 border-cyan-500/30"
                    : "text-cyan-300/90 border-transparent hover:bg-cyan-500/10"
                )}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                Support
              </Link>
            )}
            {user?.isSiteAdmin && (
              <Link
                href="/admin"
                title="Admin console"
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 border transition-colors",
                  pathname === "/admin"
                    ? "text-violet-200 bg-violet-500/10 border-violet-500/30"
                    : "text-violet-300/90 border-transparent hover:bg-violet-500/10"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Search + account */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/browse"
            className="hidden md:flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-slate-400 hover:text-white hover:border-white/20 transition"
            title="Search openings (press /)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xl:inline w-36 text-left">Search openings</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-400 border border-white/10 font-mono">/</kbd>
          </Link>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className={cn(
                  "flex items-center gap-2 h-10 pl-1 pr-2 sm:pr-3 rounded-full border transition text-left",
                  profileOpen ? "bg-white/10 border-violet-400/50" : "bg-white/[0.03] border-white/10 hover:border-white/25"
                )}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
                <span className="hidden sm:flex flex-col leading-none">
                  <span className="text-[12px] font-semibold text-white truncate max-w-[110px]">{user.username}</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider mt-1 text-slate-400">{roleLabel}</span>
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block", profileOpen && "rotate-180 text-white")} />
              </button>

              {profileOpen && (
                <div role="menu" className="animate-in absolute right-0 mt-2 w-72 rounded-2xl bg-surface border border-white/[0.12] shadow-2xl shadow-black/60 p-2 z-50">
                  <div className="p-3 rounded-xl bg-white/[0.04] flex items-center gap-3 mb-1">
                    <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{user.username}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{user.id}</div>
                      {user.robloxUsername && <div className="text-[10px] text-slate-300 font-mono truncate">@{user.robloxUsername}</div>}
                    </div>
                  </div>

                  <div className="py-1 text-[13px]">
                    <MenuLink href="/settings" icon={Settings}>Account settings</MenuLink>
                    <MenuLink href="/my-applications" icon={FileText}>My applications</MenuLink>
                    {user.hasCommunities && <MenuLink href="/dashboard" icon={LayoutDashboard}>Community dashboard</MenuLink>}

                    {isStaff && (
                      <>
                        <div className="my-1.5 border-t border-white/10" />
                        <div className="px-3 py-1 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">Internal tools</div>
                        {user.isSupportStaff && <MenuLink href="/support/panel" icon={LifeBuoy} tone="cyan">Support panel</MenuLink>}
                        {user.isSiteAdmin && <MenuLink href="/admin" icon={Shield} tone="violet">Admin console</MenuLink>}
                      </>
                    )}

                    <div className="my-1.5 border-t border-white/10" />
                    {/* POST so other sites cannot sign people out with an image tag */}
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/api/auth/login"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-semibold transition-colors"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 6px 18px -8px rgba(109,77,245,.7)" }}
            >
              Log in with Discord
            </a>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9 grid place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="animate-in lg:hidden border-t border-white/[0.07] bg-surface px-4 py-4 space-y-1" aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium",
                l.active ? "text-white bg-white/10" : "text-slate-300 hover:bg-white/5"
              )}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
          {user && (
            <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5">
              <Settings className="w-4 h-4" />
              Account settings
            </Link>
          )}
          {isStaff && (
            <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
              {user?.isSupportStaff && (
                <Link href="/support/panel" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-cyan-300 hover:bg-cyan-500/10">
                  <LifeBuoy className="w-4 h-4" />
                  Support panel
                </Link>
              )}
              {user?.isSiteAdmin && (
                <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-violet-300 hover:bg-violet-500/10">
                  <Shield className="w-4 h-4" />
                  Admin console
                </Link>
              )}
            </div>
          )}
          {user && (
            <form action="/api/auth/logout" method="post" className="pt-2 mt-2 border-t border-white/10">
              <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10">
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </form>
          )}
        </nav>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: "cyan" | "violet";
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
        tone === "cyan"
          ? "text-cyan-300 hover:bg-cyan-500/10"
          : tone === "violet"
          ? "text-violet-300 hover:bg-violet-500/10"
          : "text-slate-300 hover:text-white hover:bg-white/[0.07]"
      )}
    >
      <Icon className="w-4 h-4 opacity-80" />
      {children}
    </Link>
  );
}
