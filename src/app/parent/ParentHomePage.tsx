import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getDynamicProducts, getDynamicCountdown } from "@/lib/parent-site";
import { ParentNotifyForm } from "@/components/parent/ParentForms";
import { ParentCountdownBanner } from "@/components/parent/ParentCountdownBanner";
import { CommunityShowcaseCarousel, FeaturedStudio } from "@/components/parent/CommunityShowcaseCarousel";
import { ArrowRight, Search, ShieldCheck, Zap, Users, Sparkles, Layers, CheckCircle2, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentHomePage() {
  const [communityCount, openCount, appCount, dynamicProducts, dynamicCountdown, topCommunities] = await Promise.all([
    prisma.guild.count().catch(() => 0),
    prisma.position.count({ where: { isOpen: true } }).catch(() => 0),
    prisma.application.count().catch(() => 0),
    getDynamicProducts(),
    getDynamicCountdown(),
    prisma.guild.findMany({
      where: { isPaused: false },
      select: { id: true, name: true, icon: true, vanitySlug: true, description: true, verifiedBadges: true },
      take: 10,
      orderBy: { memberCount: "desc" },
    }).catch(() => [] as FeaturedStudio[]),
  ]);

  return (
    <div className="relative overflow-hidden bg-[#08090d] text-slate-100">
      {/* Dynamic Radial Glow Aura */}
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[750px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(90,42,162,0.60)_0%,rgba(67,29,130,0.35)_35%,rgba(19,8,38,0.20)_65%,transparent_80%)] blur-[100px]" />

      {/* Decorative Grid Mesh */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-5 pt-20 pb-20 text-center sm:px-8 sm:pt-28">
        {dynamicCountdown.targetDate && (
          <ParentCountdownBanner targetDate={dynamicCountdown.targetDate} label={dynamicCountdown.label} />
        )}

        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-[#1f0b4a]/60 px-4 py-1.5 text-xs font-semibold text-[#ddd6fe] shadow-[0_0_20px_rgba(90,42,162,0.35)] backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span>The RoleFlow Product Family</span>
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
        </div>

        <h1 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[1.1]">
          Tools built for the next generation of <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-white via-[#ddd6fe] to-[#8b5cf6] bg-clip-text text-transparent">
            Discord &amp; Roblox communities.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg sm:leading-relaxed">
          Manage recruitment, group rosters, and staff workflows from one place. One unified account across every tool we build. 100% free forever.
        </p>

        {/* Live Metrics Pill Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
          {communityCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-white font-bold">{communityCount.toLocaleString()}</span>
              <span className="text-slate-400">Communities</span>
            </div>
          )}
          {openCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              <span className="text-white font-bold">{openCount.toLocaleString()}</span>
              <span className="text-slate-400">Open Positions</span>
            </div>
          )}
          {appCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span className="text-white font-bold">{appCount.toLocaleString()}</span>
              <span className="text-slate-400">Applications Handled</span>
            </div>
          )}
        </div>

        {/* Search Bar with "/" hint */}
        <div className="mx-auto mt-10 max-w-xl">
          <form action="https://applyhub.roleflow.site/browse" method="GET" className="relative flex items-center shadow-2xl">
            <Search className="absolute left-4 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              placeholder="Search openings, groups, or studios..."
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-3.5 pl-11 pr-28 text-sm text-white placeholder-slate-400 backdrop-blur-md transition-all focus:border-[#8b5cf6] focus:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
            <div className="absolute right-2.5 flex items-center gap-2">
              <span className="hidden rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-400 sm:inline-block">/</span>
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-violet-500 hover:scale-[1.02]"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* CTA Button Group */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://applyhub.roleflow.site"
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.35)] transition-all hover:bg-violet-500 hover:scale-[1.02]"
          >
            Launch ApplyHub <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/products"
            className="rounded-xl border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
          >
            Explore All Products
          </Link>
        </div>
      </section>

      {/* Community & Studio Showcase Carousel (#3) */}
      <CommunityShowcaseCarousel communities={topCommunities} />

      {/* Product Suite Showcase with Enlarged Logos */}
      <section className="relative border-t border-white/10 bg-[#07080c] py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-violet-400">Product Lineup</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              One account. Every community tool.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Each RoleFlow tool is built from the ground up for speed, privacy, and seamless automation.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {dynamicProducts.map((prod) => {
              const isLive = prod.badge === "Live";
              return (
                <div
                  key={prod.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md transition-all hover:border-violet-500/40 hover:bg-white/[0.04] sm:p-10"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      {/* Enlarged Header Logo in card */}
                      <div className="relative h-16 w-56">
                        <img
                          src={prod.logoTransparent}
                          alt={prod.name}
                          className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                          isLive
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                        {prod.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-violet-300 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-violet-400">
                        {prod.tagline}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">
                        {prod.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    {isLive ? (
                      <a
                        href={prod.href}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-violet-500 hover:scale-[1.02]"
                      >
                        Launch Product &rarr;
                      </a>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-400">Be first to test Roster:</p>
                        <ParentNotifyForm interest="roster" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Roadmap Teaser Card (#1) */}
      <section className="relative border-t border-white/10 bg-[#08090d] py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-[#130826] via-[#1f0b4a]/70 to-[#0e0f17] p-8 shadow-2xl sm:p-14">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="space-y-4 lg:col-span-8">
                <span className="font-mono text-xs uppercase tracking-widest text-[#ddd6fe]">
                  Community-Driven Engineering
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  You decide what RoleFlow builds next.
                </h2>
                <p className="text-sm text-slate-300 sm:text-base leading-relaxed">
                  Browse real-time proposals, upvote features for Discord &amp; Roblox communities, and watch ideas transition directly to shipped tools.
                </p>
                <div className="pt-2">
                  <Link
                    href="/ideas"
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-violet-500 hover:scale-[1.02]"
                  >
                    Open Community Roadmap &rarr;
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 flex justify-center">
                <div className="w-full max-w-xs space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>TOP ROADMAP IDEA</span>
                    <span className="text-emerald-400">42 votes</span>
                  </div>
                  <p className="text-sm font-bold text-white">Bot Automated Shift Logging</p>
                  <p className="text-xs text-slate-400">Clock-in via Discord slash commands and automated Roblox group activity points.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why RoleFlow Section */}
      <section className="relative border-t border-white/10 bg-[#07080c] py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-violet-400">Core Architecture</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engineered for community leaders
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Stop stitching together spreadsheets, bot commands, and webhooks. RoleFlow unites your tools.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Single Unified Identity</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                Applicants and staff maintain one account across all RoleFlow products. Link Discord or email and sign in anywhere with zero friction.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Roblox &amp; Discord Automation</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                Automate rank changes in your Roblox groups, assign Discord roles upon approval, and notify candidates instantly via bot or email.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">100% Free Forever</h3>
              <p className="text-xs leading-relaxed text-slate-300">
                No subscription tiers, no per-seat billing, and no paywalled features. RoleFlow is committed to keeping essential management tools free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup Banner */}
      <section id="newsletter" className="relative border-t border-white/10 bg-gradient-to-b from-[#130826] to-[#08090d] py-20 text-center">
        <div className="mx-auto max-w-xl px-5 sm:px-8">
          <span className="font-mono text-xs uppercase tracking-widest text-[#ddd6fe]">Monthly Brief</span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Stay in the loop with RoleFlow
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            One monthly recap of feature releases, new product rollouts, and community spotlights. Opt-in only, one-click unsubscribe.
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <ParentNotifyForm isNewsletter />
          </div>
        </div>
      </section>
    </div>
  );
}
