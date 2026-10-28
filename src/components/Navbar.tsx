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
  User as UserIcon,
  Menu,
  X,
  ExternalLink,
  Sparkles,
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

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside or pressing Escape
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
      // Pressing "/" when not typing in an input opens search /browse
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)
      ) {
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

  // Close menus on route change
  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const roleLabel = user?.id === "1046538179399929957"
    ? "Platform Founder"
    : user?.siteRole === "ADMIN" || user?.isSiteAdmin
    ? "Site Admin"
    : user?.siteRole === "MODERATOR"
    ? "Moderator"
    : user?.siteRole === "SUPPORT"
    ? "Support Staff"
    : user?.siteRole === "STAFF"
    ? "Ordinary Staff"
    : user?.hasCommunities
    ? "Community Lead"
    : "Member";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Main Nav */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Official Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/10 shadow-md shadow-violet-500/10 group-hover:border-purple-500/50 group-hover:scale-105 transition-all">
              <img
                src="/logo.png"
                alt="RoleFlow Emblem"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-lg font-black tracking-tight text-white group-hover:text-purple-300 transition-colors">
              RoleFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/browse"
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                pathname === "/browse"
                  ? "text-white bg-white/10 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Openings</span>
            </Link>
            <Link
              href="/marketplace"
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                pathname === "/marketplace"
                  ? "text-white bg-white/10 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span>Templates</span>
            </Link>

            {user && (
              <Link
                href="/my-applications"
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                  pathname === "/my-applications"
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>My Applications</span>
              </Link>
            )}

            {user?.hasCommunities && (
              <Link
                href="/dashboard"
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
                  pathname.startsWith("/dashboard")
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}

            {/* Subtle Divider before Staff Controls */}
            {(user?.isSupportStaff || user?.isSiteAdmin) && (
              <div className="h-4 w-px bg-white/10 mx-1.5" />
            )}

            {/* Staff Navigation: Compact, polished badges */}
            {(user?.isSupportStaff || user?.isSiteAdmin) && (
              <Link
                href="/support/panel"
                title="Support Staff Diagnostic Console"
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border",
                  pathname.startsWith("/support/panel")
                    ? "text-cyan-300 bg-cyan-500/15 border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                    : "text-cyan-400/90 border-cyan-500/20 bg-cyan-950/20 hover:text-cyan-200 hover:bg-cyan-500/10 hover:border-cyan-500/40"
                )}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Support</span>
              </Link>
            )}

            {user?.isSiteAdmin && (
              <Link
                href="/admin"
                title="Founder Admin Console"
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border",
                  pathname === "/admin"
                    ? "text-purple-300 bg-purple-500/15 border-purple-500/40 shadow-sm shadow-purple-500/20"
                    : "text-purple-400/90 border-purple-500/20 bg-purple-950/20 hover:text-purple-200 hover:bg-purple-500/10 hover:border-purple-500/40"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Quick Search + User Profile Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Compact Quick Search Pill */}
          <Link
            href="/browse"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-all group"
            title="Search openings (Press /)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
            <span className="hidden xl:inline text-slate-300">Search openings...</span>
            <span className="xl:hidden text-slate-300">Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-400 border border-white/10 font-mono">
              /
            </kbd>
          </Link>

          {/* User Profile Dropdown or Login Button */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className={cn(
                  "flex items-center gap-2 p-1 pl-2 sm:pr-2.5 rounded-2xl border transition-all text-left",
                  profileOpen
                    ? "bg-white/10 border-purple-500/40 shadow-lg shadow-purple-500/10"
                    : "bg-surface/80 border-white/10 hover:border-white/20 hover:bg-white/5"
                )}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                {/* Username and Role Pill (Desktop) */}
                <div className="flex flex-col text-right hidden sm:block leading-none">
                  <span className="text-xs font-semibold text-white truncate max-w-[110px] block">
                    {user.username}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono font-medium mt-0.5 uppercase tracking-wider block",
                      user.isSiteAdmin
                        ? "text-purple-400"
                        : user.isSupportStaff
                        ? "text-cyan-400"
                        : "text-slate-400"
                    )}
                  >
                    {roleLabel}
                  </span>
                </div>

                {/* Avatar with Status Ring */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-purple-500/40 ring-2 ring-purple-500/10 shrink-0">
                  <img
                    src={
                      user.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    }
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>

                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block",
                    profileOpen && "rotate-180 text-white"
                  )}
                />
              </button>

              {/* Polished Floating User Menu Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-surface/95 border border-white/15 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Account Header */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 mb-1">
                    <img
                      src={
                        user.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={user.username}
                      className="w-10 h-10 rounded-full border border-purple-500/40 object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white truncate">
                          {user.username}
                        </span>
                        {user.isSiteAdmin && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                            FOUNDER
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        ID: {user.id}
                      </span>
                      {user.robloxUsername && (
                        <span className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1 font-mono">
                          <span className="text-purple-400"></span> @{user.robloxUsername}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1 space-y-0.5 text-xs">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      href="/my-applications"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>My Applications Hub</span>
                    </Link>

                    {user.hasCommunities && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                        <span>Community Dashboard</span>
                      </Link>
                    )}

                    {/* Staff shortcuts inside dropdown */}
                    {(user.isSupportStaff || user.isSiteAdmin) && (
                      <>
                        <div className="my-1.5 border-t border-white/10" />
                        <div className="px-3 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Internal Staff Tools
                        </div>

                        {user.isSupportStaff && (
                          <Link
                            href="/support/panel"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 transition-colors"
                          >
                            <LifeBuoy className="w-4 h-4 text-cyan-400" />
                            <span>Support Diagnostic Panel</span>
                          </Link>
                        )}

                        {user.isSiteAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-300 hover:text-purple-100 hover:bg-purple-500/10 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-purple-400" />
                            <span>Founder Admin Console</span>
                          </Link>
                        )}
                      </>
                    )}

                    <div className="my-1.5 border-t border-white/10" />

                    {/* Logout Button */}
                    <a
                      href="/api/auth/logout"
                     
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/10 transition-colors font-medium cursor-pointer"
                      onClick={() => {
                        document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.roleflow.site;";
                        document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/api/auth/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/30"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login with Discord</span>
            </a>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-surface/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/browse"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium",
              pathname === "/browse" ? "text-white bg-white/10" : "text-slate-300 hover:bg-white/5"
            )}
          >
            <Compass className="w-4 h-4" />
            <span>Browse Openings</span>
          </Link>
          <Link
            href="/marketplace"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium",
              pathname === "/marketplace" ? "text-white bg-white/10" : "text-slate-300 hover:bg-white/5"
            )}
          >
            <span>Template Marketplace</span>
          </Link>

          {user && (
            <Link
              href="/my-applications"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium",
                pathname === "/my-applications"
                  ? "text-white bg-white/10"
                  : "text-slate-300 hover:bg-white/5"
              )}
            >
              <FileText className="w-4 h-4" />
              <span>My Applications Hub</span>
            </Link>
          )}

          {user?.hasCommunities && (
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium",
                pathname.startsWith("/dashboard")
                  ? "text-white bg-white/10"
                  : "text-slate-300 hover:bg-white/5"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Community Dashboard</span>
            </Link>
          )}

          {user && (
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium",
                pathname === "/settings"
                  ? "text-white bg-white/10"
                  : "text-slate-300 hover:bg-white/5"
              )}
            >
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </Link>
          )}

          {(user?.isSupportStaff || user?.isSiteAdmin) && (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3">
                Staff Controls
              </span>
              {user.isSupportStaff && (
                <Link
                  href="/support/panel"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-cyan-300 hover:bg-cyan-500/10"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Support Panel</span>
                </Link>
              )}
              {user.isSiteAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-purple-300 hover:bg-purple-500/10"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Super-Console</span>
                </Link>
              )}
            </div>
          )}

          {user && (
            <div className="pt-2 border-t border-white/10">
              <a
                href="/api/auth/logout"
               
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                onClick={() => {
                  document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.roleflow.site;";
                  document.cookie = "roleflow_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
