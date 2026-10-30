import React from "react";
import Link from "next/link";
import Image from "next/image";

export function ParentHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090a0f]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-pack/roleflow-lockup-dark-transparent.png"
            alt="RoleFlow"
            width={140}
            height={32}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
          <Link href="/products" className="transition-colors hover:text-white">Products</Link>
          <Link href="/about" className="transition-colors hover:text-white">About</Link>
          <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
          <Link href="/ideas" className="transition-colors hover:text-white">Suggest Idea</Link>
          <Link href="/contact" className="transition-colors hover:text-white">Contact</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            Account
          </Link>
          <a
            href="https://applyhub.roleflow.site"
            className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500"
          >
            Open ApplyHub
          </a>
        </div>
      </div>
    </header>
  );
}

export function ParentFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#08090d] text-slate-400">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Image
              src="/logo-pack/roleflow-lockup-dark-transparent.png"
              alt="RoleFlow"
              width={130}
              height={30}
              className="h-6 w-auto object-contain opacity-90"
            />
            <p className="text-xs leading-relaxed text-slate-400">
              The modern family of management and operations tools for Discord servers and Roblox game studios.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">Products</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><a href="https://applyhub.roleflow.site" className="hover:text-white">ApplyHub by RoleFlow</a></li>
              <li><Link href="/products#roster" className="hover:text-white">Roster by RoleFlow (Soon)</Link></li>
              <li><Link href="/ideas" className="hover:text-white">Vote on next tool</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">Company</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href="/about" className="hover:text-white">Our Story</Link></li>
              <li><Link href="/blog" className="hover:text-white">Changelog &amp; Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact &amp; Support</Link></li>
              <li><a href="https://discord.gg/tKPbCXbmr9" target="_blank" rel="noreferrer" className="hover:text-white">Discord Community</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-200">Legal</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/acceptable-use" className="hover:text-white">Acceptable Use</Link></li>
              <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} RoleFlow. All rights reserved. Everything is free forever.</p>
          <p className="font-mono text-[11px]">support@roleflow.site</p>
        </div>
      </div>
    </footer>
  );
}
