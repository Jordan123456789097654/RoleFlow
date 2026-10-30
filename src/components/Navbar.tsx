"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    supportSession?: { expiresAt: number; ticketRef: string | null } | null;
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

  /** Ends a support diagnostic session and returns the staff member to their own account (or signs out). */
  async function endSupportSession() {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    try {
      await fetch("/api/support/end-session", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.assign("/support/panel");
    }
  }

  /** Clears the session on the server, then reloads the public home page so no signed-in state remains. */
  async function logOut() {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.assign("/");
    }
  }

  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const roleLabel =
    user?.siteRole === "FOUNDER"
      ? "Platform founder"
      : user?.siteRole === "ADMIN" || user?.isSiteAdmin
      ? "Site admin"
      : user?.siteRole === "MODERATOR"
      ? "Moderator"
      : user?.siteRole === "SUPPORT"
      ? "Support staff"
      : user?.siteRole === "STAFF"
      ? "Staff"
      : user?.hasCommunities
      ? "Community lead"
      : "Member";

  const links = [
    { href: "/browse", label: "Browse", active: pathname === "/browse" },
    ...(user ? [{ href: "/my-applications", label: "My applications", active: pathname === "/my-applications" }] : []),
    ...(user?.hasCommunities ? [{ href: "/dashboard", label: "Dashboard", active: pathname.startsWith("/dashboard") }] : []),
  ];

  const isStaff = Boolean(user?.isSupportStaff || user?.isSiteAdmin);
  const avatar = user?.avatar || FALLBACK_AVATAR;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="page-wrap flex h-16 items-center justify-between gap-6">
        {/* Brand + primary nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="RoleFlow home">
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-[19px] font-semibold tracking-tight text-ink">RoleFlow</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={cn(
                  "text-[14px] transition-colors",
                  l.active ? "font-medium text-ink underline decoration-accent decoration-2 underline-offset-[10px]" : "text-muted hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            ))}
            {isStaff && (
              <Link
                href="/support/panel"
                className={cn("text-[14px] transition-colors", pathname.startsWith("/support/panel") ? "font-medium text-ink" : "text-muted hover:text-ink")}
              >
                Support
              </Link>
            )}
            {user?.isSiteAdmin && (
              <Link
                href="/admin"
                className={cn("text-[14px] transition-colors", pathname === "/admin" ? "font-medium text-ink" : "text-muted hover:text-ink")}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Search + account */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/browse"
            className="hidden h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-[13px] text-muted transition-colors hover:border-ink hover:text-ink md:flex"
            title="Search openings (press /)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Search openings</span>
            <kbd className="kbd">/</kbd>
          </Link>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md border px-1.5 pr-2 text-left transition-colors sm:pr-3",
                  profileOpen ? "border-ink bg-surface" : "border-line-strong bg-surface hover:border-ink"
                )}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <img src={avatar} alt="" className="h-7 w-7 rounded-sm object-cover" />
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="max-w-[120px] truncate text-[13px] font-medium text-ink">{user.username}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{roleLabel}</span>
                </span>
                <ChevronDown className={cn("hidden h-3.5 w-3.5 text-muted transition-transform sm:block", profileOpen && "rotate-180 text-ink")} />
              </button>

              {profileOpen && (
                <div role="menu" className="animate-in absolute right-0 z-50 mt-2 w-72 rounded-lg border border-line-strong bg-surface p-2 shadow-pop">
                  <div className="mb-1 flex items-center gap-3 rounded-md bg-sunk p-3">
                    <img src={avatar} alt="" className="h-10 w-10 shrink-0 rounded-sm object-cover" />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-ink">{user.username}</div>
                      <div className="truncate font-mono text-[11px] text-muted">{user.id}</div>
                      {user.robloxUsername && <div className="truncate font-mono text-[11px] text-ink-2">@{user.robloxUsername}</div>}
                    </div>
                  </div>

                  <div className="py-1 text-[14px]">
                    <MenuLink href="/settings">Account settings</MenuLink>
                    <MenuLink href="/my-applications">My applications</MenuLink>
                    {user.supportSession && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={endSupportSession}
                        className="w-full rounded-sm px-3 py-2 text-left font-semibold text-ink transition-colors hover:bg-sunk"
                      >
                        End support session
                      </button>
                    )}
                    {user.hasCommunities && <MenuLink href="/dashboard">Community dashboard</MenuLink>}

                    {isStaff && (
                      <>
                        <div className="my-1.5 border-t border-line" />
                        <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-faint">Internal tools</div>
                        {user.isSupportStaff && <MenuLink href="/support/panel">Support panel</MenuLink>}
                        {(user.isSupportStaff || user.isSiteAdmin) && <MenuLink href="/support/panel#reports">Reports and review</MenuLink>}
                        {user.siteRole === "FOUNDER" && <MenuLink href="/founder">Founder console</MenuLink>}
                        {user.isSiteAdmin && <MenuLink href="/admin">Admin console</MenuLink>}
                      </>
                    )}

                    <div className="my-1.5 border-t border-line" />
                    {/* POST so other sites cannot sign people out with an image tag */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logOut}
                      className="w-full rounded-sm px-3 py-2 text-left font-medium text-danger transition-colors hover:bg-danger-soft"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" className="btn-primary btn-sm">
              Log in
            </a>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-10 w-10 place-items-center rounded-md border border-line-strong bg-surface text-ink transition-colors hover:border-ink lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="animate-in border-t border-line bg-paper px-5 py-4 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn("border-b border-line py-3.5 font-display text-[22px]", l.active ? "text-accent" : "text-ink")}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link href="/settings" className="border-b border-line py-3.5 font-display text-[22px] text-ink">
                Account settings
              </Link>
            )}
            {isStaff && (
              <div className="mt-2 flex flex-col">
                {user?.isSupportStaff && (
                  <Link href="/support/panel" className="border-b border-line py-3.5 font-display text-[22px] text-ink">Support panel</Link>
                )}
                {user?.isSiteAdmin && (
                  <Link href="/admin" className="border-b border-line py-3.5 font-display text-[22px] text-ink">Admin console</Link>
                )}
                {(user?.isSupportStaff || user?.isSiteAdmin) && (
                  <Link href="/support/panel#reports" className="border-b border-line py-3.5 font-display text-[22px] text-ink">Reports and review</Link>
                )}
                {user?.siteRole === "FOUNDER" && (
                  <Link href="/founder" className="border-b border-line py-3.5 font-display text-[22px] text-ink">Founder console</Link>
                )}
              </div>
            )}
            {user && (
              <button type="button" onClick={logOut} className="mt-2 py-3.5 text-left font-medium text-danger">Log out</button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" className="block rounded-sm px-3 py-2 text-ink-2 transition-colors hover:bg-sunk hover:text-ink">
      {children}
    </Link>
  );
}
