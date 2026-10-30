import React from "react";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About | RoleFlow",
  description: "Our story, our mission, and why RoleFlow is building tools for Discord and Roblox communities.",
};

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Our Story
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Built by community managers, for community managers.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            RoleFlow started with a simple observation: leading a community takes serious work, but the tools community staff rely on have always been fragmented.
          </p>
        </div>

        {/* Narrative */}
        <div className="mt-16 space-y-12 text-slate-300">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white">The Application Problem</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed sm:text-base">
              <p>
                In Discord servers and Roblox development studios, recruitment has traditionally meant Google Forms, messy Discord DM channels, lost tickets, and hours spent manually cross-referencing user profiles and roles.
              </p>
              <p>
                We built RoleFlow to solve that. An applicant creates one verified account, links their Roblox and Discord profiles once, and applies seamlessly. Community staff get blind voting quorum, automated ranking, audit logs, and instant group promotion.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-white">Expanding Into a Family of Products</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed sm:text-base">
              <p>
                As thousands of applications flowed through the platform, community leaders kept asking for more: staff activity trackers, group rosters, shift logs, and shared management systems.
              </p>
              <p>
                Rather than overloading one bloated interface, we decided to build RoleFlow into a parent company hosting a suite of razor-focused, lightning-fast tools:
              </p>
              <ul className="list-inside list-disc space-y-2 pt-2 text-white">
                <li><strong className="text-violet-300">ApplyHub by RoleFlow:</strong> Dedicated exclusively to hiring, vetting, and staffing workflows.</li>
                <li><strong className="text-violet-300">Roster by RoleFlow:</strong> Dedicated to member rosters, department trees, and staff shift tracking.</li>
                <li><strong className="text-violet-300">Unified Identity:</strong> One sign-in and one profile that travels with you across every tool we launch.</li>
              </ul>
            </div>
          </div>

          {/* Guiding Principles */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-2xl font-bold text-violet-400">100% Free Forever</div>
              <p className="mt-2 text-sm text-slate-300">
                No paywalled features, no artificial seat limits, and no billing. RoleFlow is built to support creators and community staff without holding tools hostage.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-2xl font-bold text-violet-400">Privacy &amp; Respect</div>
              <p className="mt-2 text-sm text-slate-300">
                Essential cookies only. No trackers, no ad networks, and no selling member data. You control your information with instant export and full deletion rights.
              </p>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center pt-8">
            <p className="text-sm text-slate-400">Have questions about the platform or want to get in touch?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                Contact Support &rarr;
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
