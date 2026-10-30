import { prisma } from "./prisma";

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

export const DEFAULT_PRODUCTS: Product[] = [
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

export const PRODUCTS = DEFAULT_PRODUCTS;

export const PARTNERS: Partner[] = [];
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

/** Fetch dynamic products from SystemSetting or fallback to defaults */
export async function getDynamicProducts(): Promise<Product[]> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: "parent_products" },
    });
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_PRODUCTS;
}

/** Fetch dynamic countdown target */
export async function getDynamicCountdown(): Promise<{ targetDate: string | null; label: string | null }> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: "parent_countdown" },
    });
    if (row?.value) {
      return JSON.parse(row.value);
    }
  } catch {
    // fallback
  }
  return { targetDate: null, label: null };
}
