import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CommunityCard } from "@/components/CommunityCard";
import {
  Search,
  ArrowRight,
  Sparkles,
  Bot,
  Gamepad2,
  CheckCircle2,
  Users2,
  ShieldCheck,
  Zap,
  Lock,
  MessagesSquare,
  Vote,
  Clock,
  Send,
  Layers,
} from "lucide-react";

export const revalidate = 0; // Fresh dynamic counts

export default async function HomePage() {
  const [guilds, totalOpenPositions, communityCount, totalAppsProcessed] = await Promise.all([
    prisma.guild.findMany({
      include: {
        positions: { where: { isOpen: true } },
        reviews: { select: { rating: true } },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.position.count({ where: { isOpen: true } }),
    prisma.guild.count(),
    prisma.application.count(),
  ]);

  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden">
      {/* ───────── Ambient Glowing Auroras ───────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-violet-600/20 via-fuchsia-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-96 left-1/4 w-[600px] h-[400px] bg-indigo-600/15 blur-[140px] pointer-events-none -z-10" />

      {/* ───────── Hero Section ───────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-20 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Live Platform Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-950/40 backdrop-blur-md text-xs text-violet-200 shadow-lg shadow-violet-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">RoleFlow Recruiting</span>
            <span className="text-violet-400">·</span>
            <span>{totalOpenPositions} open role{totalOpenPositions === 1 ? "" : "s"} live now</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            The intelligent hiring platform for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300">
              communities &amp; studios
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Stop sorting through chaotic Discord DMs and fragile spreadsheets. Centralize applications, automate role grants, and conduct fair staff reviews with your own white-label bot.
          </p>

          {/* Interactive Search + Primary Action */}
          <div className="pt-2 max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-3">
            <form action="/browse" method="GET" className="relative flex-1 flex items-center" role="search">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <label htmlFor="home-search" className="sr-only">Search roles and communities</label>
              <input
                id="home-search"
                type="text"
                name="q"
                placeholder="Search studios, clans, moderation, scripters..."
                className="w-full h-13 pl-11 pr-10 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-violet-500/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 backdrop-blur-md transition-all"
              />
              <kbd className="absolute right-3.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">/</kbd>
            </form>
            <Link
              href="/browse"
              className="h-13 px-7 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all shrink-0 active:scale-[0.98]"
            >
              <span>Explore Openings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Sub-navigation */}
          <div className="flex items-center justify-center gap-5 text-xs text-slate-400">
            <Link href="/my-applications" className="hover:text-white transition-colors">Track my submissions</Link>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Create / Manage community →</Link>
          </div>
        </div>

        {/* ───────── Stats Metric Bar ───────── */}
        <div className="mt-16 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Communities", value: communityCount },
            { label: "Open Positions", value: totalOpenPositions },
            { label: "Applications Processed", value: totalAppsProcessed > 0 ? totalAppsProcessed : "Active" },
            { label: "Average Setup Time", value: "< 5 mins" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.07] backdrop-blur-md text-center"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stat.value}</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Featured Communities ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Active Studios &amp; Communities</h2>
          </div>
          <Link
            href="/browse"
            className="text-xs text-violet-300 hover:text-white inline-flex items-center gap-1 font-semibold transition-colors shrink-0"
          >
            <span>View all directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {guilds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {guilds.map((g) => {
              const reviewsCount = g.reviews.length;
              const avgRating =
                reviewsCount > 0
                  ? Number((g.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1))
                  : null;

              return (
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
                    category: g.category,
                    positionsCount: g.positions.length,
                    description: g.description,
                    rating: avgRating,
                    reviewsCount,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center text-sm text-slate-400">
            No communities listed yet. Be the first to open applications!
          </div>
        )}
      </section>

      {/* ───────── Three Pillar Interactive Flow ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center mb-14 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-400">Workflow</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Recruiting built for modern teams</h2>
          <p className="text-sm text-slate-400">Everything needed to source, evaluate, and onboard candidates with zero friction.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1. One-Click Applications</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Applicants authenticate through Discord, link verified Roblox profiles, and complete smart forms with dynamic conditional questions.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <Vote className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">2. Collaborative Review</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scorecards, blind voting, and private internal notes eliminate review bias and prevent noisy opinions from dominating evaluations.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">3. Automated Actions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly grant Discord roles, promote ranks in Roblox groups via Open Cloud, and dispatch custom embed notifications under your own bot identity.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── Feature Matrix Grid ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1">Architecture</div>
          <h2 className="text-3xl font-extrabold text-white">Engineered for reliability &amp; scale</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Bot,
              title: "White-Label Custom Bot",
              desc: "Deploy automated embeds, role assigners, and slash commands under your community's own bot avatar and name.",
            },
            {
              icon: Gamepad2,
              title: "Roblox Group Auto-Ranking",
              desc: "Connect your Roblox Open Cloud API key to automatically promote accepted applicants in your Roblox Group.",
            },
            {
              icon: ShieldCheck,
              title: "Anti-Alt & Age Verification",
              desc: "Gate submissions by minimum account age, Discord membership, and required Roblox badges to block burner accounts.",
            },
            {
              icon: MessagesSquare,
              title: "Interactive Ticket Channels",
              desc: "Moving an applicant to Interview automatically provisions a private text thread in your Discord server.",
            },
            {
              icon: Zap,
              title: "Discord Slash Commands",
              desc: "Register native /status, /apply, /openings, /accept, and /reject commands directly to your staff bot.",
            },
            {
              icon: Lock,
              title: "Encrypted Token Vault",
              desc: "All Discord bot tokens and Roblox Open Cloud keys are stored using AES-256-GCM encryption.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all"
            >
              <item.icon className="w-5 h-5 text-violet-400 mb-3" />
              <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Final Call to Action ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-24 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-950/40 via-surface-card to-surface-card p-10 sm:p-16 text-center shadow-2xl">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to streamline your staff hiring?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Launch your community portal in under five minutes. Connect your Discord bot, create custom forms, and start reviewing candidates today.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
              >
                <span>Set Up Your Community</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/browse"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all"
              >
                Browse Open Openings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
