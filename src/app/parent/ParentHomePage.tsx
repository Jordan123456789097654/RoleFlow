import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PRODUCTS, PARTNERS, TESTIMONIALS } from "@/lib/parent-site";
import { ParentNotifyForm } from "@/components/parent/ParentForms";

export const dynamic = "force-dynamic";

export default async function ParentHomePage() {
  const [communityCount, openCount] = await Promise.all([
    prisma.guild.count().catch(() => 0),
    prisma.position.count({ where: { isOpen: true } }).catch(() => 0),
  ]);

  return (
    <div className="relative overflow-hidden">
      {/* Glow Center Aura */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(90,42,162,0.35)_0%,rgba(67,29,130,0.15)_45%,transparent_70%)] blur-[90px]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-5xl px-5 pt-20 pb-16 text-center sm:px-8 sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3.5 py-1 text-xs font-semibold text-violet-300 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
          The RoleFlow Family of Products
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
          Tools built for the next generation of <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-white via-violet-300 to-indigo-300 bg-clip-text text-transparent">
            Discord & Roblox communities.
          </span>
        </h1>

        {/* Live Numbers */}
        {(communityCount > 0 || openCount > 0) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
            {communityCount > 0 && (
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                <strong className="text-white">{communityCount}</strong> Active Communities
              </span>
            )}
            {openCount > 0 && (
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1">
                <strong className="text-emerald-400">{openCount}</strong> Open Positions Right Now
              </span>
            )}
          </div>
        )}

        {/* Search Bar with "/" Hint */}
        <div className="mx-auto mt-8 max-w-lg">
          <form action="/browse" method="GET" className="relative flex items-center">
            <input
              type="text"
              name="q"
              placeholder="Search openings, groups, or studios..."
              className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 pl-4 pr-24 text-sm text-white placeholder-slate-400 backdrop-blur-md transition-all focus:border-violet-500 focus:bg-white/10 focus:outline-none"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <span className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 sm:inline-block">/</span>
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-500"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://applyhub.roleflow.site"
            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:bg-violet-500"
          >
            Launch ApplyHub
          </a>
          <Link
            href="/products"
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            Explore All Products
          </Link>
        </div>
      </section>

      {/* The Story Section */}
      <section className="border-t border-white/10 bg-[#07080c] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center">
            <h2 className="font-mono text-xs uppercase tracking-widest text-violet-400">Our Story</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              From one application tool to a complete ecosystem.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-bold text-white">Where we started</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                RoleFlow started as an application platform. Discord and Roblox communities were collecting applications in DMs and spreadsheets, and it was chaos. We built one place where applicants apply once and staff review everything together.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-bold text-white">Where we are now</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                That first tool is now called ApplyHub. We&apos;re growing it into a family of tools for running communities, under the RoleFlow name. Each one solves a real problem we heard from the people using it, and all of them share one account.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-bold text-white">Who it&apos;s for</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Discord and Roblox communities, from studios and clans to creator networks, and the people who want to join them. Everything is free forever with no paywalls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <div className="text-center">
          <h2 className="font-mono text-xs uppercase tracking-widest text-violet-400">The Family</h2>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">Products by RoleFlow</p>
          <p className="mx-auto mt-3 max-w-lg text-xs text-slate-400">
            One single account powers all RoleFlow tools. Sign in once, link your Discord, and operate your entire group.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="flex flex-col justify-between rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.05] to-transparent p-7 transition-all hover:border-violet-500/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      prod.badge === "Live"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    }`}
                  >
                    {prod.badge}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">Free forever</span>
                </div>

                <div className="mt-6 flex h-14 items-center">
                  <Image
                    src={prod.logoTransparent}
                    alt={prod.name}
                    width={220}
                    height={50}
                    className="max-h-12 w-auto object-contain"
                  />
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">{prod.name}</h3>
                <p className="mt-1 text-xs font-medium text-violet-300">{prod.tagline}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{prod.description}</p>
              </div>

              <div className="mt-8 border-t border-white/10 pt-5">
                {prod.badge === "Live" ? (
                  <a
                    href={prod.href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white transition-colors hover:text-violet-400"
                  >
                    Open Product Portal →
                  </a>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400">Get notified when Roster opens for beta testers:</p>
                    <ParentNotifyForm interest={prod.id} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="border-t border-white/10 bg-[#08090d] py-16">
        <div className="mx-auto max-w-xl px-5 text-center sm:px-8">
          <h2 className="text-xl font-bold text-white">Monthly RoleFlow Newsletter</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            One concise email a month with new product releases, platform changes, and community highlights. Opt-in only with 1-click unsubscribe.
          </p>
          <div className="mt-6">
            <ParentNotifyForm isNewsletter />
          </div>
        </div>
      </section>
    </div>
  );
}
