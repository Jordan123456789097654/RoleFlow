import React from "react";
import Image from "next/image";
import { CheckCircle2, Shield } from "lucide-react";

export interface FeaturedStudio {
  id: string;
  name: string;
  icon?: string | null;
  vanitySlug?: string | null;
  verifiedBadges?: string | null;
  description?: string | null;
}

export function CommunityShowcaseCarousel({
  communities,
}: {
  communities: FeaturedStudio[];
}) {
  if (!communities || communities.length === 0) return null;

  // Duplicate list to achieve continuous infinite marquee scrolling
  const list = [...communities, ...communities];

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[#07080c] py-14">
      <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
        <span className="font-mono text-xs uppercase tracking-widest text-violet-400">
          Trusted Ecosystem
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Powering top Roblox studios &amp; Discord communities
        </h2>
      </div>

      {/* Marquee Track */}
      <div className="relative mt-10 w-full overflow-hidden mask-gradient-x">
        <div className="flex w-max animate-marquee items-center gap-6 py-2">
          {list.map((c, i) => (
            <a
              key={`${c.id}-${i}`}
              href={`https://applyhub.roleflow.site/c/${c.vanitySlug || c.id}`}
              className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-md transition-all hover:border-violet-500/50 hover:bg-white/[0.06] hover:scale-[1.02]"
            >
              {c.icon ? (
                <img
                  src={c.icon}
                  alt={c.name}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-violet-500/50"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 font-bold text-violet-300 ring-1 ring-white/10">
                  {c.name.slice(0, 1)}
                </div>
              )}

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    {c.name}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-violet-400" />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[180px]">
                  {c.description || "Active Roblox & Discord Studio"}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
