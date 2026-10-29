import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CommunityCard } from "@/components/CommunityCard";
import { ArrowRight, Search } from "lucide-react";

export const revalidate = 0; // Fresh dynamic counts

const FEATURES = [
  {
    n: "01",
    title: "One application, one place",
    desc: "Applicants answer a single form. Staff see every submission, every status and every note in one pipeline, not scattered across DMs.",
  },
  {
    n: "02",
    title: "Blind, fair review",
    desc: "Reviewers score candidates privately. Scores stay hidden until quorum is reached, so the first opinion doesn't decide.",
  },
  {
    n: "03",
    title: "Your bot, your brand",
    desc: "Embeds, role grants, applicant DMs and interview threads go out under your own Discord bot identity.",
  },
  {
    n: "04",
    title: "Roblox group ranking",
    desc: "Accepted staff are promoted in your Roblox group through official Open Cloud APIs, with no manual steps.",
  },
  {
    n: "05",
    title: "Checks against alts",
    desc: "Require minimum Discord account age, server membership or Roblox badges before an application reaches your team.",
  },
  {
    n: "06",
    title: "Works from Discord",
    desc: "Staff can accept, reject and check status with slash commands without leaving their server.",
  },
];

export default async function HomePage() {
  const [guilds, totalOpenPositions, communityCount] = await Promise.all([
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
            {FEATURES.map((f) => (
              <div key={f.n} className="border-b border-r border-line p-7">
                <p className="font-mono text-[12px] text-accent">{f.n}</p>
                <h3 className="mt-4 font-display text-[22px] leading-tight text-ink">{f.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{f.desc}</p>
              </div>
            ))}
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
