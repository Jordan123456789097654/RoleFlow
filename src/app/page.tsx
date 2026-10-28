import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CommunityCard } from "@/components/CommunityCard";
import { Search, Sparkles, ArrowRight, ShieldCheck, Flame, Compass } from "lucide-react";

export const revalidate = 0; // Fresh dynamic counts

export default async function HomePage() {
  // Fetch communities with their positions
  const guilds = await prisma.guild.findMany({
    include: {
      positions: {
        where: { isOpen: true },
      },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  // Calculate total open positions
  const totalOpenPositions = await prisma.position.count({
    where: { isOpen: true },
  });

  return (
    <div className="relative pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center">
      {/* Brand header / small pill */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl font-bold tracking-tight text-white/90">
          RoleFlow
        </span>
      </div>

      {/* Main Hero Headline */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          The new way of <br />
          managing{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]">
            applications
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Communities post openings. People apply once. Staff review, interview, and decide in
          one place instead of drowning in Discord DMs.
        </p>

        {/* Dynamic Counter */}
        <div className="pt-2">
          <span className="text-xs sm:text-sm font-medium text-slate-400">
            {totalOpenPositions} open position{totalOpenPositions === 1 ? "" : "s"} right now
          </span>
        </div>
      </div>

      {/* Search Bar & Primary CTA */}
      <div className="w-full max-w-2xl mt-8 flex flex-col sm:flex-row items-center gap-3">
        <form
          action="/browse"
          method="GET"
          className="relative flex-1 w-full flex items-center"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            name="q"
            placeholder="Search roles, communities..."
            className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-surface/90 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-xl"
          />
          <div className="absolute right-3.5 flex items-center">
            <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
              /
            </kbd>
          </div>
        </form>

        <Link
          href="/browse"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
        >
          <span>Browse openings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick Navigation sublinks */}
      <div className="flex items-center gap-6 mt-5 text-xs text-slate-400 font-medium">
        <Link
          href="/my-applications"
          className="hover:text-purple-300 transition-colors"
        >
          My applications
        </Link>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <Link
          href="/dashboard"
          className="hover:text-purple-300 transition-colors"
        >
          Manage a community
        </Link>
      </div>

      {/* Featured Communities Showcase (Matching screenshot cards) */}
      <div className="w-full mt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Featured Communities & Studios
            </h2>
          </div>

          <Link
            href="/browse"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
      </div>

      {/* Feature Value Props Section */}
      <div className="w-full mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
        <div className="p-6 rounded-2xl bg-surface/50 border border-white/5 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-purple-400 mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Apply Once, Track Everywhere</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Apply with your verified Discord & Roblox credentials. Auto-save drafts prevent losing work, and receive live status updates.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface/50 border border-white/5 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Unified Staff Dashboard</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Kanban workflow, blind voting to prevent bias, canned responses, and customizable cooldowns to keep low-effort spam out.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface/50 border border-white/5 space-y-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <Compass className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">White-label Discord Bot</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Use the default AppliBot or enter your community&apos;s custom bot token. Automatic role assignments, quick Discord buttons, and interview tickets.
          </p>
        </div>
      </div>
    </div>
  );
}
