import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CommunityCard } from "@/components/CommunityCard";
import {
  Search,
  ArrowRight,
  FileText,
  Users,
  CheckCircle2,
  EyeOff,
  Bot,
  Gamepad2,
  Timer,
  MessagesSquare,
} from "lucide-react";

export const revalidate = 0; // Fresh dynamic counts

const STEPS = [
  { icon: FileText, title: "Apply once", body: "Sign in with Discord, link Roblox, and answer a community's questions. Drafts auto-save as you type." },
  { icon: Users, title: "Staff review together", body: "A shared pipeline with ratings, blind voting and private notes replaces scattered DMs and spreadsheets." },
  { icon: CheckCircle2, title: "Decisions that land", body: "Roles are granted and applicants are told automatically, by DM, email, and on their tracking page." },
];

const FEATURES = [
  { icon: EyeOff, title: "Blind voting", body: "Votes stay hidden until each reviewer submits, so one loud opinion can't steer the team." },
  { icon: Bot, title: "White-label Discord bot", body: "Run the RoleFlow bot or bring your own: your name, avatar, embed colors, staff pings and role grants." },
  { icon: Gamepad2, title: "Roblox-aware", body: "Verified Roblox accounts, group rank checks and live profile previews for developer studios." },
  { icon: Timer, title: "Anti-burnout tools", body: "Rejection cooldowns, community blacklists, and one-click templates keep low-effort spam out." },
  { icon: MessagesSquare, title: "Interview channels", body: "Moving someone to Interview opens a private thread in Discord, with no manual setup." },
  { icon: FileText, title: "Quick actions", body: "Accept or reject straight from the staff embed or with slash commands, without leaving Discord." },
];

export default async function HomePage() {
  const [guilds, totalOpenPositions, communityCount] = await Promise.all([
    prisma.guild.findMany({
      include: { positions: { where: { isOpen: true } } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.position.count({ where: { isOpen: true } }),
    prisma.guild.count(),
  ]);

  return (
    <div className="relative">
      {/* ───────── Hero ───────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 h-7 pl-2 pr-3 rounded-full border border-white/10 bg-white/[0.04] text-[12px] text-slate-300 mb-8 animate-rf-fade">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {totalOpenPositions} open position{totalOpenPositions === 1 ? "" : "s"} right now
          </div>

          <h1 className="text-[2.6rem] sm:text-6xl lg:text-7xl font-bold text-white leading-[1.04]">
            The new way of
            <br />
            managing <span className="rf-gradient-text">applications</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Communities post openings. People apply once. Staff review, interview, and decide in one place instead of drowning in Discord DMs.
          </p>

          {/* Search + CTA */}
          <div className="mt-10 max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-3">
            <form action="/browse" method="GET" className="relative flex-1 flex items-center" role="search">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
              <label htmlFor="home-search" className="sr-only">Search roles and communities</label>
              <input
                id="home-search"
                type="text"
                name="q"
                placeholder="Search roles, communities…"
                className="w-full h-12 pl-11 pr-10 rounded-xl bg-surface-card border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/15 transition"
              />
              <kbd className="absolute right-3.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">/</kbd>
            </form>
            <Link href="/browse" className="rf-btn-primary h-12 shrink-0">
              Browse openings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-5 flex items-center justify-center gap-5 text-[13px] text-slate-400">
            <Link href="/my-applications" className="hover:text-white transition-colors">My applications</Link>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <Link href="/dashboard" className="hover:text-white transition-colors">Manage a community</Link>
          </div>
        </div>

        {/* Stat strip */}
        <dl className="mt-16 max-w-3xl mx-auto grid grid-cols-3 rounded-2xl border border-white/[0.07] bg-surface-card/60 divide-x divide-white/[0.07]">
          {[
            { k: "Communities", v: communityCount },
            { k: "Open positions", v: totalOpenPositions },
            { k: "Avg. setup time", v: "5 min" },
          ].map((s) => (
            <div key={s.k} className="py-5 px-3 text-center">
              <dd className="font-display text-2xl sm:text-3xl font-bold text-white">{s.v}</dd>
              <dt className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500">{s.k}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ───────── Featured communities ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="rf-eyebrow mb-2">Now hiring</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured communities &amp; studios</h2>
          </div>
          <Link href="/browse" className="text-[13px] text-violet-300 hover:text-white inline-flex items-center gap-1 font-medium transition-colors shrink-0">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {guilds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {guilds.map((g) => (
              <CommunityCard
                key={g.id}
                guild={{
                  id: g.id,
                  name: g.name,
                  icon: g.icon,
                  banner: g.banner,
                  vanitySlug: g.vanitySlug,
                  isVerified: g.isVerified,
                  verifiedBadge: g.verifiedBadge,
                  memberCount: g.memberCount,
                  tags: g.tags,
                  positionsCount: g.positions.length,
                  description: g.description,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rf-card p-10 text-center text-sm text-slate-400">No communities yet. Be the first to open applications.</div>
        )}
      </section>

      {/* ───────── How it works ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10">
          <p className="rf-eyebrow mb-2">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">From first click to final decision, in one place</h2>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rf-card p-6 relative overflow-hidden">
              <span className="absolute -top-3 right-4 font-display text-7xl font-bold text-white/[0.04] select-none">{i + 1}</span>
              <span className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/20 text-violet-300 grid place-items-center mb-4">
                <s.icon className="w-5 h-5" />
              </span>
              <h3 className="text-base font-semibold text-white mb-1.5">{s.title}</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── Feature grid ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10">
          <p className="rf-eyebrow mb-2">For staff teams</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built to keep reviewers fast, fair and un-burnt-out</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.07]">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface p-6 hover:bg-surface-card transition-colors">
              <f.icon className="w-5 h-5 text-violet-300 mb-4" />
              <h3 className="text-[15px] font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── CTA band ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-8 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface-card px-6 py-14 sm:px-14 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(60%_90%_at_50%_0%,rgba(127,102,255,0.28),transparent_70%)]" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to run applications properly?</h2>
            <p className="mt-3 text-slate-400 max-w-xl mx-auto">Create your community in minutes, add positions, and connect your Discord server.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard" className="rf-btn-primary">Set up your community <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/browse" className="rf-btn-ghost">Browse openings</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
