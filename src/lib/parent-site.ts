export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  href: string;
  badge: "Live" | "Coming soon";
  logoSolid: string;
  logoTransparent: string;
}

export interface Partner {
  name: string;
  url: string;
  logoUrl?: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  community: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readTime: string;
}

export const SUPPORT_EMAIL = "support@roleflow.site";

export const PRODUCTS: Product[] = [
  {
    id: "applyhub",
    name: "ApplyHub by RoleFlow",
    tagline: "Recruitment and staff applications in one place.",
    description: "Applicants apply once. Community staff review, vote with blind quorum, and automate Roblox group promotions and Discord roles.",
    href: "https://applyhub.roleflow.site",
    badge: "Live",
    logoSolid: "/logo-pack/applyhub-by-roleflow-solid.png",
    logoTransparent: "/logo-pack/applyhub-by-roleflow-transparent.png",
  },
  {
    id: "roster",
    name: "Roster by RoleFlow",
    tagline: "Staff and member management for Roblox groups.",
    description: "Track staff members, manage department rosters, coordinate training shifts, and maintain a unified staff activity log.",
    href: "#notify-roster",
    badge: "Coming soon",
    logoSolid: "/logo-pack/roster-by-roleflow-solid.png",
    logoTransparent: "/logo-pack/roster-by-roleflow-transparent.png",
  },
];

/** Approved partners list. Kept empty until approved partners are confirmed by the owner. */
export const PARTNERS: Partner[] = [];

/** Approved testimonials list. Kept empty until approved quotes are provided by the owner. */
export const TESTIMONIALS: Testimonial[] = [];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "introducing-roleflow-family",
    title: "Introducing the RoleFlow Product Family",
    date: "October 2026",
    excerpt: "Why we're growing RoleFlow from a single application tool into a suite of focused community management utilities under one account.",
    readTime: "3 min read",
  },
];

/** Optional product countdown target set by staff (null until staff sets it) */
export const COUNTDOWN_TARGET: Date | null = null;
