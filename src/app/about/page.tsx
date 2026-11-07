import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Our Story | RoleFlow",
  description: "The story behind RoleFlow, our founder Jordan Daniels, and our mission to build free tools for Roblox and Discord communities.",
};

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Our Story
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Built out of frustration.<br className="hidden sm:inline" /> Built for the community.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            RoleFlow was started by developers who got tired of watching community leaders struggle with broken bots, messy Google Forms, and paywalled tools.
          </p>
        </div>

        {/* Narrative */}
        <div className="mt-16 space-y-12 text-slate-300">
          {/* Origin */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white">The Problem We Set Out to Solve</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed sm:text-base">
              <p>
                Running a Roblox studio, a roleplay community, or a gaming Discord server is a full-time job. Behind every thriving community is a team of leaders spending their late nights sorting through unformatted Google Forms, manually cross-referencing user profiles, fixing broken rank bots, and tracking staff activity across chaotic spreadsheets.
              </p>
              <p>
                Most software available in this space is either abandoned, buggy, or locked behind aggressive monthly paywalls that independent studios can&apos;t justify paying.
              </p>
              <p>
                We built RoleFlow to put an end to that cycle. We believe community leaders deserve modern, reliable, and high-performance software that does the heavy lifting automatically—without holding basic features hostage.
              </p>
            </div>
          </div>

          {/* Founder Section */}
          <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-transparent p-8 sm:p-12">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-violet-400">
              <span>Leadership</span>
              <span>&bull;</span>
              <span>Engineering</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">Meet the Founder: Jordan Daniels</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              <p>
                RoleFlow was founded in late 2026 by <strong className="text-white">Jordan Daniels</strong>, an independent developer and longtime community creator.
              </p>
              <p>
                After managing groups firsthand and watching staff teams burn out from repetitive manual tasks, Jordan set out to build the platform he wished existed when he started. What began as a focused tool to automate applications quickly expanded into an entire interconnected ecosystem designed to handle the full operational lifecycle of a community.
              </p>
              <p>
                Jordan personally architects and writes the code powering RoleFlow—combining robust full-stack web engineering, official Discord gateway integrations, and secure Roblox Open Cloud automation to give creators enterprise-grade tools with zero corporate bloat.
              </p>
            </div>
          </div>

          {/* The Products */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white">The RoleFlow Suite</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed sm:text-base">
              <p>
                Instead of cramming every feature into a single bloated, confusing interface, RoleFlow operates as a parent ecosystem hosting three razor-focused tools under <strong className="text-white">one unified identity</strong>:
              </p>
              <ul className="list-inside list-disc space-y-3 pt-2 text-white">
                <li>
                  <strong className="text-violet-300">ApplyHub:</strong> Dedicated application portals with automated Roblox verification, anti-alt filters, blind team voting, and stage reviews.
                </li>
                <li>
                  <strong className="text-violet-300">RankHub:</strong> Automated group ranking powered by an Open Cloud API &amp; cookie dual vault, visual rank ladders, batch ranking with dry-run simulations, and automated anti-nuke protection.
                </li>
                <li>
                  <strong className="text-violet-300">Roster:</strong> A centralized staff command center for shift tracking, host attendance logs, moderation records, and one-click staff history cards.
                </li>
              </ul>
            </div>
          </div>

          {/* Guiding Principles */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-xl font-bold text-violet-400">100% Free Forever</div>
              <p className="mt-2 text-sm text-slate-300">
                No paywalled features, no artificial seat limits, and no hidden subscriptions. RoleFlow is built to support creators without holding essential tools hostage.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-xl font-bold text-violet-400">Privacy &amp; Respect</div>
              <p className="mt-2 text-sm text-slate-300">
                Essential cookies only. No trackers, no ad networks, and no selling member data. You maintain complete control with instant export and deletion rights.
              </p>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center pt-8">
            <p className="text-sm text-slate-400">Have questions, feedback, or want to connect your group?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Get in Touch &rarr;
              </Link>
              <Link
                href="/products"
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
