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
  author: string;
  content: string[];
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
    date: "October 30, 2026",
    excerpt: "Why we're growing RoleFlow from a single application tool into a suite of focused community management utilities under one account.",
    readTime: "3 min read",
    author: "RoleFlow Engineering Team",
    content: [
      "When we first conceived RoleFlow, the goal was singularly focused: eliminate the chaos of managing community staff applications across messy Discord DMs, Google Forms, and manual Roblox group ranking.",
      "As hundreds of communities and thousands of candidates adopted the platform, leaders consistently asked for more: unified department rosters, automated shift tracking, shift logs, and shared management systems.",
      "Rather than cramming every feature into a single bloated interface, we made an architectural commitment: transform RoleFlow into a parent company hosting a family of razor-focused, lightning-fast web products.",
      "Under this new foundation, every tool shares a single account and single sign-in. Whether you are reviewing candidate submissions in ApplyHub or organizing studio department trees in Roster, your identity travels with you seamlessly.",
      "And our promise remains unchanged: every tool in the RoleFlow family is 100% free forever, supported by clean engineering and essential privacy.",
    ],
  },
  {
    slug: "why-we-are-free-forever",
    title: "Why RoleFlow is 100% Free Forever",
    date: "October 2026",
    excerpt: "No paywalled features, no per-seat billing, and no credit card requirements. Our commitment to creators.",
    readTime: "4 min read",
    author: "RoleFlow Founder",
    content: [
      "Community management tools have increasingly locked basic necessities behind expensive monthly subscription tiers. For young developers and growing Roblox game studios, paying per staff seat simply doesn't scale.",
      "We believe high-quality automation, blind voting quorums, and recruitment portals should be accessible to any community leader building something great.",
      "By engineering RoleFlow with ultra-efficient serverless hosting, optimized PostgreSQL indexing, and lightweight caching, we keep operating overhead negligible.",
      "We do not sell member data, and we do not serve invasive ad tracking. Everything is funded directly by our team so you can focus on building your community.",
    ],
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
