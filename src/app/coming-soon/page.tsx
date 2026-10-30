import React from "react";
import type { Metadata } from "next";
import { KeyRound, Home, ClipboardList, Flame, ShieldCheck, Rocket, Newspaper, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "RoleFlow | Something greater is coming",
  robots: { index: false, follow: false },
};

const COMING = [
  { icon: KeyRound, title: "One account for everything", text: "Sign in once and use every RoleFlow product." },
  { icon: Home, title: "A home for RoleFlow", text: "A parent site that brings all of our products together." },
  { icon: ClipboardList, title: "A new home for applications", text: "Browsing openings front and center." },
  { icon: Flame, title: "Streaks and live updates", text: "Daily check-ins, and pages that stay current without a refresh." },
  { icon: ShieldCheck, title: "Your account, your control", text: "Export your data or delete your account from one place." },
  { icon: Rocket, title: "New products", text: "Starting with the one our communities choose." },
  { icon: Newspaper, title: "A monthly newsletter", text: "Opt-in only, with one-click unsubscribe." },
];

export default function ComingSoonPage() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-paper">
      {/* Brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.35),_transparent_70%)]"
      />

      <header className="page-wrap flex items-center justify-between py-6">
        <span className="font-display text-xl font-semibold text-ink">RoleFlow</span>
        <a
          href="https://discord.gg/tKPbCXbmr9"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-line-strong px-3.5 py-2 text-sm font-semibold text-ink hover:border-ink"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Discord
        </a>
      </header>

      <section className="page-wrap pb-16 pt-12 text-center sm:pt-20">
        <span className="inline-block rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-300">
          Back soon
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">
          Something greater is <span className="text-violet-600 dark:text-violet-400">coming.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
          We&apos;ve paused the platform while we build what comes next. Your applications and data are safe, and we&apos;ll share the date as soon as it&apos;s ready.
        </p>
      </section>

      <section aria-labelledby="coming-heading" className="page-wrap pb-20">
        <h2 id="coming-heading" className="mb-8 text-center font-display text-2xl font-semibold text-ink">
          What&apos;s coming
        </h2>
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMING.map(({ icon: Icon, title, text }) => (
            <article key={title} className="card group p-6 transition-colors hover:border-violet-400/50">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <a
            href="https://discord.gg/tKPbCXbmr9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-opacity hover:opacity-90"
          >
            Join our Discord for updates
          </a>
          <p className="mt-5 text-sm text-muted">Questions? support@roleflow.site</p>
        </div>
      </section>
    </div>
  );
}
