import { openNowWhere } from "@/lib/position-availability";
import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CommunityCard } from "@/components/CommunityCard";
import { ArrowRight, Search, FileText, EyeOff, Bot, ShieldCheck, UserCheck, Terminal } from "lucide-react";

export const revalidate = 0; // Fresh dynamic counts

const FEATURES = [
  {
    n: "01",
    title: "One application, one place",
    desc: "Applicants answer a single form. Staff see every submission, every status and every note in one pipeline, not scattered across DMs.",
    icon: FileText,
    badge: "Unified Intake",
    preview: (
      <div className="mt-4 rounded-lg border border-line bg-surface/70 p-3 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
          <span className="text-muted">Applicant #1489</span>
          <span className="px-1.5 py-0.5 rounded bg-moss/20 text-moss text-[10px] font-semibold">Under Review</span>
        </div>
        <div className="space-y-1 text-ink-2">
          <div className="flex justify-between"><span>Position:</span> <span className="text-ink">Lead Moderator</span></div>
          <div className="flex justify-between"><span>Submitted:</span> <span className="text-muted">14m ago</span></div>
        </div>
      </div>
    ),
  },
  {
    n: "02",
    title: "Blind, fair review",
    desc: "Reviewers score candidates privately. Scores stay hidden until quorum is reached, so the first opinion doesn't decide.",
    icon: EyeOff,
    badge: "Anti-Bias",
    preview: (
      <div className="mt-4 rounded-lg border border-line bg-surface/70 p-3 text-xs font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted">Quorum Progress</span>
          <span className="text-accent text-[11px] font-bold">2 / 3 Votes</span>
        </div>
        <div className="h-1.5 w-full bg-sunk rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full w-2/3" />
        </div>
        <p className="mt-2 text-[10px] text-muted italic">Individual scores locked until quorum met</p>
      </div>
    ),
  },
  {
    n: "03",
    title: "Your bot, your brand",
    desc: "Embeds, role grants, applicant DMs and interview threads go out under your own Discord bot identity.",
    icon: Bot,
    badge: "Custom Bot",
    preview: (
      <div className="mt-4 rounded-lg border border-line bg-surface/70 p-3 text-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-4 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-[9px]">B</div>
          <span className="font-semibold text-ink text-[11px]">RoleFlow App Bot</span>
          <span className="rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-1 py-0.2 text-[9px]">BOT</span>
        </div>
        <div className="border-l-2 border-indigo-500 pl-2 text-ink-2 text-[11px]">
          🎉 Congratulations! Your staff application has been accepted.
        </div>
      </div>
    ),
  },
  {
    n: "04",
    title: "Roblox group ranking",
    desc: "Accepted staff are promoted in your Roblox group through official Open Cloud APIs, with no manual steps.",
    icon: ShieldCheck,
    badge: "Open Cloud",
    preview: (
      <div className="mt-4 rounded-lg border border-line bg-surface/70 p-3 text-xs font-mono">
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted">Roblox Group Rank</span>
          <span className="text-moss text-[10px] font-bold">Auto-Sync</span>
        </div>
        <div className="flex items-center gap-2 text-ink text-[11px] mt-1.5">
          <span className="text-muted">Guest (1)</span>
          <span>→</span>
          <span className="text-moss font-semibold">Trial Mod (15)</span>
        </div>
      </div>
    ),
  },
  {
    n: "05",
    title: "Checks against alts",
    desc: "Require minimum Discord account age, server membership or Roblox badges before an application reaches your team.",
    icon: UserCheck,
    badge: "Verification",
    preview: (
      <div className="mt-4 rounded-lg border border-line bg-surface/70 p-3 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-2">Discord Age &gt; 30d</span>
            <span className="text-moss font-semibold text-[10px]">✓ Passed (214d)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-2">Roblox Alt Filter</span>
            <span className="text-moss font-semibold text-[10px]">✓ Clean</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    n: "06",
    title: "Works from Discord",
    desc: "Staff can accept, reject and check status with slash commands without leaving their server.",
    icon: Terminal,
    badge: "Slash Cmds",
    preview: (
      <div className="mt-4 rounded-lg border border-line bg-surface/70 p-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-accent text-[11px]">
          <span>/applications accept</span>
          <span className="text-muted">id: 1489</span>
        </div>
        <p className="mt-1 text-[10px] text-ink-2">Roles assigned &amp; applicant notified instantly</p>
      </div>
    ),
  },
];

export default async function HomePage() {
  const [guilds, totalOpenPositions, communityCount] = await Promise.all([
    prisma.guild.findMany({
      include: {
        positions: { where: openNowWhere() },
        reviews: { select: { rating: true } },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.position.count({ where: openNowWhere() }),
    prisma.guild.count(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="page-wrap pt-14 pb-16 sm:pt-24 sm:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-6 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-moss" />
              {totalOpenPositions} positions open across {communityCount} communities
            </p>
            <h1 className="display-xl">
              Staff applications,<br />
              <span className="italic text-accent">finally in order.</span>
            </h1>
            <p className="lede mt-7 max-w-xl">
              RoleFlow is where Discord and Roblox communities post openings, collect applications once, and review candidates together, without the chaos of channels and DMs.
            </p>

            <form action="/browse" method="GET" className="mt-10 flex max-w-xl flex-col gap-2 sm:flex-row">
              <label htmlFor="home-search" className="sr-only">Search openings</label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <input
                  id="home-search"
                  type="text"
                  name="q"
                  placeholder="Community, role, studio or tag"
                  className="field h-12 pl-10 text-[15px]"
                />
              </div>
              <button type="submit" className="btn-primary btn-lg">Find openings</button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
              <Link href="/browse" className="inline-flex items-center gap-1 text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                Browse all communities <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/my-applications" className="text-muted hover:text-ink">Check an application</Link>
              <Link href="/dashboard" className="text-muted hover:text-ink">Community admin dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Communities */}
      <section className="border-t border-line">
        <div className="page-wrap section">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow mb-3">Directory</p>
              <h2 className="display-md">Communities recruiting now</h2>
            </div>
            <Link href="/browse" className="inline-flex items-center gap-1 text-[14px] font-medium text-ink hover:text-accent">
              View full directory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {guilds.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="card p-12 text-center">
              <p className="display-md">No communities yet</p>
              <p className="mt-3 text-[15px] text-muted">Be the first to open applications.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line">
        <div className="page-wrap section">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow mb-3">What it does</p>
            <h2 className="display-md">Everything a recruiting team needs, and nothing it doesn&apos;t.</h2>
          </div>
          <div className="grid grid-cols-1 border-l border-t border-line md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.n} className="border-b border-r border-line p-7 flex flex-col justify-between hover:bg-surface/30 transition-colors">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[12px] text-accent font-semibold">{f.n}</p>
                      <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <Icon className="h-3 w-3" />
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-[22px] leading-tight text-ink">{f.title}</h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{f.desc}</p>
                  </div>
                  {f.preview}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="border-t border-line">
        <div className="page-wrap section">
          <div className="card flex flex-col items-start justify-between gap-8 p-8 sm:flex-row sm:items-center sm:p-12">
            <div className="max-w-xl">
              <h2 className="display-md">Set up your portal in about five minutes.</h2>
              <p className="mt-3 text-[15px] text-muted">
                Add your positions, connect a Discord bot if you want one, and start reviewing applicants.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/dashboard" className="btn-accent btn-lg">Create a community</Link>
              <Link href="/browse" className="btn-ghost btn-lg">Browse openings</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
