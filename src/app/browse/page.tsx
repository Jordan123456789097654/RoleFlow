import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search, Briefcase, Users, BadgeCheck, ArrowRight, Star, Building2, Sparkles } from "lucide-react";
import { CommunityCard } from "@/components/CommunityCard";

export const revalidate = 0;

interface BrowsePageProps {
  searchParams?: {
    tab?: string; // "positions" | "communities"
    q?: string;
    category?: string;
    department?: string;
    sort?: string; // "openings" | "rating" | "newest"
  };
}

const CATEGORIES = [
  "All",
  "Roblox Studios",
  "Emergency Services",
  "Tech & Dev",
  "Gaming Clans",
  "Creator Networks",
];

const DEPARTMENTS = [
  "All Departments",
  "Development",
  "Staff & Moderation",
  "Design",
  "Community",
];

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const query = searchParams?.q?.toLowerCase() || "";
  const selectedCategory = searchParams?.category || "All";
  const selectedDept = searchParams?.department || "";
  const sort = searchParams?.sort || "openings";
  const activeTab = searchParams?.tab === "positions" ? "positions" : "communities";

  // Build params helper
  const createQueryString = (paramsToUpdate: Record<string, string | null>) => {
    const current = new URLSearchParams();
    if (activeTab !== "communities") current.set("tab", activeTab);
    if (query) current.set("q", query);
    if (selectedCategory && selectedCategory !== "All") current.set("category", selectedCategory);
    if (selectedDept && selectedDept !== "All Departments") current.set("department", selectedDept);
    if (sort && sort !== "openings") current.set("sort", sort);

    for (const [key, val] of Object.entries(paramsToUpdate)) {
      if (val === null || val === "" || (key === "category" && val === "All") || (key === "department" && val === "All Departments")) {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    }
    const str = current.toString();
    return str ? `?${str}` : "";
  };

  // 1. Fetch Communities with category, search query, reviews, and positions
  const categoryFilter =
    selectedCategory && selectedCategory !== "All"
      ? {
          OR: [
            { category: selectedCategory },
            { tags: { contains: selectedCategory } },
          ],
        }
      : {};

  const communityQueryFilter = query
    ? {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } },
          { category: { contains: query } },
        ],
      }
    : {};

  const rawCommunities = await prisma.guild.findMany({
    where: {
      isPaused: false,
      ...categoryFilter,
      ...communityQueryFilter,
    },
    include: {
      positions: {
        where: { isOpen: true, isPublic: true },
        include: { _count: { select: { applications: true } } },
      },
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate rating stats and sort
  const communities = rawCommunities.map((g) => {
    const reviewsCount = g.reviews.length;
    const avgRating =
      reviewsCount > 0
        ? Number((g.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1))
        : 0;

    return {
      ...g,
      avgRating,
      reviewsCount,
      positionsCount: g.positions.length,
    };
  });

  // Apply sorting
  if (sort === "openings") {
    communities.sort((a, b) => b.positionsCount - a.positionsCount || b.avgRating - a.avgRating);
  } else if (sort === "rating") {
    communities.sort((a, b) => b.avgRating - a.avgRating || b.reviewsCount - a.reviewsCount);
  } else if (sort === "newest") {
    communities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 2. Fetch Individual Positions
  const positionQueryFilter = query
    ? {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { guild: { name: { contains: query } } },
        ],
      }
    : {};

  const positionDeptFilter =
    selectedDept && selectedDept !== "All Departments" ? { department: selectedDept } : {};

  const positions = await prisma.position.findMany({
    where: {
      isOpen: true,
      isPublic: true,
      guild: {
        isPaused: false,
        ...(selectedCategory && selectedCategory !== "All"
          ? {
              OR: [
                { category: selectedCategory },
                { tags: { contains: selectedCategory } },
              ],
            }
          : {}),
      },
      ...positionDeptFilter,
      ...positionQueryFilter,
    },
    include: {
      guild: {
        include: {
          reviews: { select: { rating: true } },
        },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
      <header className="mb-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Community Discovery &amp; Portals
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Explore Communities &amp; Open Roles
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2.5 leading-relaxed">
          Find verified Roblox development studios, emergency services clans, tech collectives, and creator teams hiring right now.
        </p>
      </header>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4 mb-6">
        <Link
          href={`/browse${createQueryString({ tab: "communities" })}`}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "communities"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Communities ({communities.length})
        </Link>
        <Link
          href={`/browse${createQueryString({ tab: "positions" })}`}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "positions"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Individual Openings ({positions.length})
        </Link>
      </div>

      {/* Category Pills Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isAll = cat === "All";
            const isActive = isAll ? selectedCategory === "All" : selectedCategory === cat;
            return (
              <Link
                key={cat}
                href={`/browse${createQueryString({ category: isAll ? null : cat })}`}
                className={`h-9 px-4 inline-flex items-center rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-violet-500/20 border-violet-400/50 text-violet-200 shadow-sm"
                    : "bg-surface-card/60 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search Bar + Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <form method="GET" action="/browse" role="search" className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={
              activeTab === "communities"
                ? "Search communities by name, tag, or focus…"
                : "Search openings by role title, studio, or tag…"
            }
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15 transition"
          />
          {activeTab !== "communities" && <input type="hidden" name="tab" value={activeTab} />}
          {selectedCategory !== "All" && <input type="hidden" name="category" value={selectedCategory} />}
          {selectedDept && <input type="hidden" name="department" value={selectedDept} />}
          {sort !== "openings" && <input type="hidden" name="sort" value={sort} />}
        </form>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Sorting for Communities */}
          {activeTab === "communities" && (
            <div className="flex items-center gap-1.5 bg-surface-card border border-white/10 rounded-xl p-1 text-xs">
              <span className="text-slate-500 px-2 font-medium">Sort:</span>
              <Link
                href={`/browse${createQueryString({ sort: "openings" })}`}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  sort === "openings" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Open Openings
              </Link>
              <Link
                href={`/browse${createQueryString({ sort: "rating" })}`}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  sort === "rating" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Most Reviewed
              </Link>
              <Link
                href={`/browse${createQueryString({ sort: "newest" })}`}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  sort === "newest" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Newest
              </Link>
            </div>
          )}

          {/* Department Filters for Individual Openings Tab */}
          {activeTab === "positions" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {DEPARTMENTS.map((dept) => {
                const isAll = dept === "All Departments";
                const isActive = isAll ? !selectedDept : selectedDept === dept;
                return (
                  <Link
                    key={dept}
                    href={`/browse${createQueryString({ department: isAll ? null : dept })}`}
                    className={`h-9 px-3 inline-flex items-center rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                      isActive
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-surface-card border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    {dept}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content Rendering */}
      {activeTab === "communities" ? (
        <div>
          {communities.length === 0 ? (
            <div className="rf-card text-center py-16 px-6">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No communities match your filter</h3>
              <p className="text-[13px] text-slate-400 mt-1 max-w-sm mx-auto">
                Try selecting a different category or clearing your search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {communities.map((g) => (
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
                    verifiedBadges: g.verifiedBadges,
                    memberCount: g.memberCount,
                    tags: g.tags,
                    category: g.category,
                    positionsCount: g.positionsCount,
                    description: g.description,
                    rating: g.avgRating,
                    reviewsCount: g.reviewsCount,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {positions.length === 0 ? (
            <div className="rf-card text-center py-16 px-6">
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No open positions found</h3>
              <p className="text-[13px] text-slate-400 mt-1 max-w-sm mx-auto">
                Try adjusting your search criteria or department filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {positions.map((pos) => {
                const reviews = pos.guild.reviews;
                const avg =
                  reviews.length > 0
                    ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                    : null;

                return (
                  <article
                    key={pos.id}
                    className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-card border border-white/10 shrink-0">
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
                              <span className="text-[13px] font-medium text-slate-200 truncate">
                                {pos.guild.name}
                              </span>
                              {pos.guild.isVerified && (
                                <BadgeCheck className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                              )}
                            </div>
                            {pos.department && (
                              <span className="text-[11px] text-violet-300">{pos.department}</span>
                            )}
                          </div>
                        </div>

                        {avg && (
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-semibold text-amber-300 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{avg}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-[17px] font-semibold text-white mb-2">{pos.title}</h3>
                      <p className="text-[13px] text-slate-400 line-clamp-3 leading-relaxed mb-5">
                        {pos.description}
                      </p>
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
