import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getDynamicProducts } from "@/lib/parent-site";
import { ParentNotifyForm } from "@/components/parent/ParentForms";

export const metadata = {
  title: "Products | RoleFlow",
  description: "Explore the family of products built for community management and recruitment.",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getDynamicProducts();
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
            Product Family
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Built for communities that build things.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            RoleFlow is expanding into a family of focused products. Each product is engineered for high performance, ease of use, and shared account identity.
          </p>
        </div>

        {/* Product Cards */}
        <div className="mt-16 space-y-12">
          {products.map((prod) => {
            const isLive = prod.badge === "Live";
            return (
              <div
                key={prod.id}
                id={prod.id === "roster" ? "notify-roster" : undefined}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md transition-all sm:p-12"
              >
                <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                  <div className="space-y-4 lg:col-span-7">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          isLive
                            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                          }`}
                        />
                        {prod.badge}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                      {prod.name}
                    </h2>
                    <p className="text-base font-medium text-violet-300">
                      {prod.tagline}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                      {prod.description}
                    </p>

                    <div className="pt-4">
                      {isLive ? (
                        <Link
                          href={prod.href}
                          className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-500 hover:scale-[1.02]"
                        >
                          Launch {prod.name} &rarr;
                        </Link>
                      ) : (
                        <div className="max-w-md space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Get notified when early access begins
                          </p>
                          <ParentNotifyForm interest="roster" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center lg:col-span-5">
                    <div className="relative flex aspect-video w-full max-w-sm items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 shadow-inner">
                      <Image
                        src={prod.logoSolid}
                        alt={prod.name}
                        width={280}
                        height={100}
                        className="max-h-24 w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestion Callout */}
        <div className="mt-16 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center sm:p-12">
          <h3 className="text-xl font-bold text-white">Have an idea for the next RoleFlow tool?</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
            We build what Roblox and Discord community leaders need most. Vote on future tools or submit your own request.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/ideas"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Browse &amp; Submit Tool Ideas &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
