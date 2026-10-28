import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search, Briefcase, Users, BadgeCheck, ArrowRight, Filter, Sparkles } from "lucide-react";
import { CommunityCard } from "@/components/CommunityCard";

export const revalidate = 0;

interface BrowsePageProps {
  searchParams?: {
    q?: string;
    department?: string;
  };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const query = searchParams?.q?.toLowerCase() || "";
  const selectedDept = searchParams?.department || "";

  // Fetch all positions that are open, public, and in non-paused communities
  const positions = await prisma.position.findMany({
    where: {
      isOpen: true,
      isPublic: true,
      guild: { isPaused: false },
      ...(selectedDept ? { department: selectedDept } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
              { guild: { name: { contains: query } } },
            ],
          }
        : {}),
    },
    include: {
      guild: true,
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const departments = [
    "All Departments",
    "Development",
    "Staff & Moderation",
    "Design",
    "Community",
  ];

  const qs = query ? `q=${encodeURIComponent(query)}` : "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
      <header className="mb-10 max-w-2xl">
        <p className="rf-eyebrow mb-2">Openings</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Browse open positions</h1>
        <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
          Staff, developer and builder openings across verified Discord communities and Roblox studios.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <form method="GET" action="/browse" role="search" className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <label htmlFor="browse-q" className="sr-only">Filter by title or community</label>
          <input
            id="browse-q"
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Filter by title or community…"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-400/70 focus:ring-4 focus:ring-violet-500/15 transition"
          />
          {selectedDept && <input type="hidden" name="department" value={selectedDept} />}
        </form>

        <nav aria-label="Departments" className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {departments.map((dept) => {
            const isAll = dept === "All Departments";
            const isActive = isAll ? !selectedDept : selectedDept === dept;
            const href = isAll
              ? `/browse${qs ? `?${qs}` : ""}`
              : `/browse?department=${encodeURIComponent(dept)}${qs ? `&${qs}` : ""}`;
            return (
              <Link
                key={dept}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`h-9 px-3.5 inline-flex items-center rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:border-white/25"
                }`}
              >
                {dept}
              </Link>
            );
          })}
        </nav>
      </div>

      <p className="text-[12px] text-slate-500 mb-4">{positions.length} opening{positions.length === 1 ? "" : "s"}</p>

      {positions.length === 0 ? (
        <div className="rf-card text-center py-16 px-6">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No open positions found</h3>
          <p className="text-[13px] text-slate-400 mt-1 max-w-sm mx-auto">Try a different search or department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {positions.map((pos) => (
            <article key={pos.id} className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-card border border-white/10 shrink-0">
                    {pos.guild.icon ? (
                      <img src={pos.guild.icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-500 to-violet-700 grid place-items-center font-display font-bold text-xs text-white">
                        {pos.guild.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-medium text-slate-200 truncate">{pos.guild.name}</span>
                      {pos.guild.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-violet-300 shrink-0" />}
                    </div>
                    {pos.department && <span className="text-[11px] text-violet-300">{pos.department}</span>}
                  </div>
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2">{pos.title}</h3>
                <p className="text-[13px] text-slate-400 line-clamp-3 leading-relaxed mb-5">{pos.description}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[12px] text-slate-500 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {pos._count.applications} applied
                </span>
                <Link href={`/apply/${pos.id}`} className="rf-btn-primary !px-3.5 !py-2 !text-[13px]">
                  Apply <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
