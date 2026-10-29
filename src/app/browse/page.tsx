import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search, Briefcase, Users, ArrowRight, Star, Building2, BadgeCheck } from "lucide-react";
import { CommunityCard } from "@/components/CommunityCard";
import { cn } from "@/lib/utils";

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

const SORTS: Array<{ value: string; label: string }> = [
  { value: "openings", label: "Most openings" },
  { value: "rating", label: "Most reviewed" },
  { value: "newest", label: "Newest" },
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

  const tabClass = (on: boolean) =>
    cn(
      "relative -mb-px pb-3 text-[15px] transition-colors",
      on ? "font-medium text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-accent" : "text-muted hover:text-ink"
    );

  return (
    <div className="page-wrap pt-12 pb-20 sm:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow mb-4">Directory</p>
        <h1 className="display-lg">Find your next role.</h1>
        <p className="lede mt-4">
          Roblox studios, emergency services units, tech collectives and creator teams that are hiring right now.
        </p>
      </header>

      {/* Tabs */}
      <div className="mt-12 flex items-end gap-8 border-b border-line">
        <Link href={`/browse${createQueryString({ tab: "communities" })}`} className={tabClass(activeTab === "communities")}>
          Communities <span className="ml-1 font-mono text-[13px] text-faint tabular-nums">{communities.length}</span>
        </Link>
        <Link href={`/browse${createQueryString({ tab: "positions" })}`} className={tabClass(activeTab === "positions")}>
          Open positions <span className="ml-1 font-mono text-[13px] text-faint tabular-nums">{positions.length}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form method="GET" action="/browse" role="search" className="relative w-full lg:max-w-md">
          <label htmlFor="browse-q" className="sr-only">Search</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            id="browse-q"
            type="text"
            name="q"
            defaultValue={query}
            placeholder={
              activeTab === "communities"
                ? "Search communities by name, tag or focus"
                : "Search openings by role, studio or tag"
            }
            className="field h-11 pl-10"
          />
          {activeTab !== "communities" && <input type="hidden" name="tab" value={activeTab} />}
          {selectedCategory !== "All" && <input type="hidden" name="category" value={selectedCategory} />}
          {selectedDept && <input type="hidden" name="department" value={selectedDept} />}
          {sort !== "openings" && <input type="hidden" name="sort" value={sort} />}
        </form>

        {activeTab === "communities" && (
          <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-muted">Sort</span>
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={`/browse${createQueryString({ sort: s.value })}`}
                className={cn(
                  "rounded-md border px-3 py-1.5 transition-colors",
                  sort === s.value ? "border-ink bg-ink text-paper" : "border-line-strong text-ink-2 hover:border-ink hover:text-ink"
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Category chips */}
      <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => {
          const isAll = cat === "All";
          const isActive = isAll ? selectedCategory === "All" : selectedCategory === cat;
          return (
            <Link
              key={cat}
              href={`/browse${createQueryString({ category: isAll ? null : cat })}`}
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-[13px] transition-colors",
                isActive ? "border-accent bg-accent-soft text-accent-ink" : "border-line-strong text-ink-2 hover:border-ink hover:text-ink"
              )}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {activeTab === "positions" && (
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          {DEPARTMENTS.map((dept) => {
            const isAll = dept === "All Departments";
            const isActive = isAll ? !selectedDept : selectedDept === dept;
            return (
              <Link
                key={dept}
                href={`/browse${createQueryString({ department: isAll ? null : dept })}`}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-[13px] transition-colors",
                  isActive ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink hover:text-ink"
                )}
              >
                {dept}
              </Link>
            );
          })}
        </div>
      )}

      {/* Results */}
      <div className="mt-10">
        {activeTab === "communities" ? (
          communities.length === 0 ? (
            <EmptyState icon={Building2} title="No communities match" body="Try a different category or clear your search." />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
          )
        ) : positions.length === 0 ? (
          <EmptyState icon={Briefcase} title="No open positions found" body="Try a different search or department." />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {positions.map((pos) => {
              const reviews = pos.guild.reviews;
              const avg =
                reviews.length > 0
                  ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                  : null;

              return (
                <li key={pos.id} className="group flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                      <span className="inline-flex items-center gap-1 font-medium text-ink-2">
                        {pos.guild.name}
                        {pos.guild.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-moss" />}
                      </span>
                      {pos.department && <span className="chip">{pos.department}</span>}
                      {avg && (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Star className="h-3 w-3 fill-gold text-gold" />
                          {avg}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-[22px] leading-snug text-ink">{pos.title}</h3>
                    <p className="mt-1.5 line-clamp-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">{pos.description}</p>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                      <Users className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{pos._count.applications}</span> applied
                    </span>
                    <Link href={`/apply/${pos.id}`} className="btn-primary btn-sm">
                      Apply <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-20 text-center">
      <Icon className="mb-4 h-8 w-8 text-faint" />
      <h3 className="display-md">{title}</h3>
      <p className="mt-2 max-w-sm text-[14px] text-muted">{body}</p>
    </div>
  );
}
