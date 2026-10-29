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
  ShieldCheck,
  Zap,
  Users2,
  MessagesSquare,
  Vote,
  Terminal,
  Activity,
  Award,
  ChevronRight,
  Flame,
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
    <div className="relative min-h-screen text-slate-100 overflow-hidden bg-[#07080c]">
      {/* ───────── Dynamic Grid Background & Neon Glows ───────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,58,237,0.25),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent pointer-events-none" />
      
      {/* ───────── Top Hero Stage ───────── */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs text-violet-300 font-medium mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.15)] animate-rf-fade">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white font-semibold">RoleFlow v2.0 Live</span>
            <span className="text-violet-400/60">/</span>
            <span>{totalOpenPositions} positions open across {communityCount} communities</span>
          </div>

          {/* Bold Modern Headline */}
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.05] text-balance">
            Next-generation recruiting for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 drop-shadow-[0_0_35px_rgba(168,85,247,0.35)]">
              Discord &amp; Roblox
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-7 text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed text-pretty">
            Stop managing staff applications across unorganized Discord channels and manual DMs. RoleFlow combines beautiful custom applicant portals, white-label bots, and Roblox group auto-ranking into a single command center.
          </p>

          {/* Search Console */}
          <div className="mt-10 w-full max-w-2xl">
            <form action="/browse" method="GET" className="relative flex items-center p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-violet-500/50 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/20 shadow-2xl backdrop-blur-xl transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 pointer-events-none" />
              <input
                type="text"
                name="q"
                placeholder="Search by community name, role, studio, or tags..."
                className="w-full bg-transparent border-none pl-3.5 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shrink-0 shadow-lg shadow-violet-600/30 transition-all"
              >
                Find Openings
              </button>
            </form>
          </div>

          {/* Secondary Action Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <Link href="/browse" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>Explore all communities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <Link href="/my-applications" className="hover:text-white transition-colors">
              Check submission status
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
              Community admin dashboard →
            </Link>
          </div>
        </div>

        {/* ───────── Interactive Showcase Mockup Card ───────── */}
        <div className="mt-16 max-w-5xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-3 sm:p-5 shadow-[0_0_80px_rgba(139,92,246,0.12)]">
          <div className="rounded-2xl border border-white/10 bg-[#0d0e15] overflow-hidden shadow-2xl">
            {/* Window Header */}
            <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-mono text-slate-500">roleflow.site/c/meridian-studios</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Bot Connected
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  Roblox Rank Auto-Sync
                </span>
              </div>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Incoming Pipeline</span>
                </div>
                <div className="text-xl font-extrabold text-white">48 Submissions</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Real-time submissions verified against Discord account age &amp; Roblox inventory.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-400 flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5" />
                  <span>Blind Staff Voting</span>
                </div>
                <div className="text-xl font-extrabold text-white">Unbiased Decisions</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Reviewers score candidates privately. Scores unlock only when threshold is met.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Instant Bot Dispatch</span>
                </div>
                <div className="text-xl font-extrabold text-white">1-Click Actions</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Acceptance triggers automatic Discord roles and Roblox Open Cloud group promotions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Featured Communities ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Verified Hubs</span>
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

      {/* ───────── Feature Deep Dive ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1.5">Platform Features</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Everything modern teams need</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Bot,
              title: "White-Label Discord Bot",
              desc: "Run embeds, role assigners, and status DMs under your own server's bot identity. No third-party watermarks.",
            },
            {
              icon: Gamepad2,
              title: "Roblox Open Cloud Auto-Ranking",
              desc: "Promote accepted staff directly in your Roblox Group using official Roblox Open Cloud v2 APIs with 0 manual effort.",
            },
            {
              icon: ShieldCheck,
              title: "Anti-Alt & Age Verification",
              desc: "Enforce Discord account age, server membership, and Roblox badge ownership checks to weed out troll accounts.",
            },
            {
              icon: Vote,
              title: "Blind Staff Voting",
              desc: "Keep evaluations completely objective. Staff review candidates privately and scores reveal once quorum is reached.",
            },
            {
              icon: MessagesSquare,
              title: "Discord Ticket Thread Sync",
              desc: "Advance candidates to interview status to automatically spawn private staff interview threads in your server.",
            },
            {
              icon: Zap,
              title: "Slash Command Suite",
              desc: "Execute /status, /apply, /openings, /accept, and /reject directly inside Discord through your custom bot.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 hover:border-violet-500/40 transition-all space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Bottom Hero Call to Action ───────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 max-w-7xl mx-auto">
        <div className="relative rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/60 via-[#0d0e18] to-purple-950/60 p-10 sm:p-16 text-center overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to upgrade your staff pipeline?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Launch your community portal in under 5 minutes. Set up positions, hook your Discord bot, and start reviewing applicants effortlessly.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-violet-600/40"
              >
                Create Community Free
              </Link>
              <Link
                href="/browse"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all"
              >
                Browse Open Roles
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
