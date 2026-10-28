"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Shield, User, Search, Layers, Compass, ExternalLink, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    id: string;
    username: string;
    avatar: string | null;
    isSiteAdmin?: boolean;
    hasCommunities?: boolean;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg leading-none">R</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors">
              RoleFlow
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/browse"
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === "/browse"
                  ? "text-white bg-white/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                Browse Openings
              </span>
            </Link>

            {user && (
              <Link
                href="/my-applications"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/my-applications"
                    ? "text-white bg-white/5"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                My Applications
              </Link>
            )}

            {/* ONLY show Dashboard / Manage Community if user owns a community or is admin */}
            {user?.hasCommunities && (
              <Link
                href="/dashboard"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith("/dashboard")
                    ? "text-white bg-white/5"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                Dashboard
              </Link>
            )}

            {user?.isSiteAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                  pathname === "/admin"
                    ? "text-purple-300 bg-purple-500/10 border border-purple-500/30"
                    : "text-purple-400 hover:text-purple-200 hover:bg-purple-500/10"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Super-Console
              </Link>
            )}
          </nav>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search positions...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-400 border border-white/10">
              /
            </kbd>
          </Link>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-xs font-semibold text-white">{user.username}</span>
                <span className="text-[10px] text-purple-400">
                  {user.isSiteAdmin ? "Site Admin" : "Community Lead"}
                </span>
              </div>
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-purple-500/40 object-cover ring-2 ring-purple-500/10"
              />
              <Link
                href="/settings"
                title="Account Settings & Support"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <a
                href="/api/auth/logout"
                title="Logout"
                className="text-[10px] text-slate-500 hover:text-rose-400 ml-1 transition-colors"
              >
                Logout
              </a>
            </div>
          ) : (
            <a
              href="/api/auth/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-md shadow-violet-600/30"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login with Discord</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
