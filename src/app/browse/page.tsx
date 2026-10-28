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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Browse Open Positions
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore staff, developer, and builder openings across verified Discord communities and Roblox studios.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Search */}
        <form method="GET" action="/browse" className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Filter by title, community..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </form>

        {/* Department Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {departments.map((dept) => {
            const isAll = dept === "All Departments";
            const isActive = isAll ? !selectedDept : selectedDept === dept;
            const href = isAll
              ? `/browse${query ? `?q=${query}` : ""}`
              : `/browse?department=${encodeURIComponent(dept)}${query ? `&q=${query}` : ""}`;

            return (
              <Link
                key={dept}
                href={href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30"
                    : "bg-surface border-white/5 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                {dept}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Positions List Grid */}
      {positions.length === 0 ? (
        <div className="text-center py-16 border border-white/5 rounded-2xl bg-surface/30">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No open positions found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filter to see more openings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between border border-white/5 hover:border-purple-500/40 transition-all duration-300"
            >
              <div>
                {/* Community Header */}
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-card border border-white/10 shrink-0">
                    {pos.guild.icon ? (
                      <img src={pos.guild.icon} alt={pos.guild.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-violet-600 flex items-center justify-center font-bold text-xs text-white">
                        {pos.guild.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-300 truncate">
                        {pos.guild.name}
                      </span>
                      {pos.guild.isVerified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-purple-400 shrink-0 fill-purple-400/20" />
                      )}
                    </div>
                    {pos.department && (
                      <span className="text-[10px] text-purple-400 font-medium">
                        {pos.department}
                      </span>
                    )}
                  </div>
                </div>

                {/* Position Title & Description */}
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-300">
                  {pos.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {pos.description}
                </p>
              </div>

              {/* Bottom Apply Action */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
                <span className="text-[11px] text-slate-500">
                  {pos._count.applications} submitted
                </span>

                <Link
                  href={`/apply/${pos.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/20"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
