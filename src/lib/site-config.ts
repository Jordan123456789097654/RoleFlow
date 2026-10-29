/**
 * Look and copy for a community's custom-domain site. Stored as JSON in Guild.siteConfig, with the
 * accent color, layout and announcement living in their own columns. Everything here is validated on
 * the way in, so the renderer can trust the shape.
 */

export const HEADER_STYLES = ["banner", "plain"] as const;
export type HeaderStyle = (typeof HEADER_STYLES)[number];

export const PORTAL_LAYOUTS = ["banner", "minimal", "cards"] as const;
export type PortalLayout = (typeof PORTAL_LAYOUTS)[number];

export type SiteLink = { label: string; url: string };

export const MAX_HEADER_LINKS = 5;
export const MAX_FOOTER_LINKS = 6;

export type SiteConfig = {
  headerStyle: HeaderStyle;
  buttonLabel: string; // label for the header's sign-in / apply button
  showHeader: boolean;
  headerLinks: SiteLink[]; // shown in the header, https links only
  showFooter: boolean;
  footerNote: string; // text above the footer links
  footerLinks: SiteLink[];
  showReviews: boolean;
  seoTitle: string; // browser tab and search title; empty = community name
  seoDescription: string; // search and share description; empty = community description
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  headerStyle: "banner",
  buttonLabel: "Sign in",
  showHeader: true,
  headerLinks: [],
  showFooter: true,
  footerNote: "",
  footerLinks: [],
  showReviews: true,
  seoTitle: "",
  seoDescription: "",
};

/** Keeps only well-formed links: a short label and an https address. Drops anything else. */
export function readLinks(raw: unknown, max: number): SiteLink[] {
  if (!Array.isArray(raw)) return [];
  const out: SiteLink[] = [];
  for (const item of raw) {
    if (out.length >= max) break;
    if (!item || typeof item !== "object") continue;
    const label = typeof (item as any).label === "string" ? (item as any).label.trim().slice(0, 40) : "";
    const url = cleanHttpsUrl((item as any).url, 500);
    if (label && typeof url === "string") out.push({ label, url });
  }
  return out;
}

/** Validates a link list from the dashboard. Returns undefined when any entry is invalid or the list is too long. */
export function validateLinks(raw: unknown, max: number): SiteLink[] | undefined {
  if (!Array.isArray(raw) || raw.length > max) return undefined;
  const out: SiteLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return undefined;
    const label = typeof (item as any).label === "string" ? (item as any).label.trim() : "";
    const url = cleanHttpsUrl((item as any).url, 500);
    if (!label || label.length > 40 || typeof url !== "string") return undefined;
    out.push({ label, url });
  }
  return out;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Accepts "" to clear an optional https URL. Returns undefined when the value is invalid. */
export function cleanHttpsUrl(v: unknown, max = 500): string | null | undefined {
  if (v === "" || v === null) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s || s.length > max) return undefined;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

export function cleanAccent(v: unknown): string | undefined {
  return typeof v === "string" && HEX.test(v) ? v.toLowerCase() : undefined;
}

export function cleanText(v: unknown, max: number): string | undefined {
  if (v === null || v === undefined) return "";
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length > max ? undefined : s;
}

/** Merges a stored value with defaults. Unknown keys are dropped, bad values fall back to defaults. */
export function readSiteConfig(raw: unknown): SiteConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  return {
    headerStyle: (HEADER_STYLES as readonly string[]).includes(r.headerStyle as string)
      ? (r.headerStyle as HeaderStyle)
      : DEFAULT_SITE_CONFIG.headerStyle,
    buttonLabel: typeof r.buttonLabel === "string" && r.buttonLabel.trim() ? r.buttonLabel.slice(0, 30) : DEFAULT_SITE_CONFIG.buttonLabel,
    showHeader: bool(r.showHeader, DEFAULT_SITE_CONFIG.showHeader),
    headerLinks: readLinks(r.headerLinks, MAX_HEADER_LINKS),
    showFooter: bool(r.showFooter, DEFAULT_SITE_CONFIG.showFooter),
    footerNote: str(r.footerNote, 160),
    footerLinks: readLinks(r.footerLinks, MAX_FOOTER_LINKS),
    showReviews: bool(r.showReviews, DEFAULT_SITE_CONFIG.showReviews),
    seoTitle: str(r.seoTitle, 70),
    seoDescription: str(r.seoDescription, 200),
  };
}

/** Validates a partial update coming from the dashboard. Returns an error message, or the cleaned patch. */
export function validateSitePatch(body: Record<string, unknown>):
  | { ok: true; data: Record<string, unknown>; siteConfig?: SiteConfig }
  | { ok: false; error: string } {
  const data: Record<string, unknown> = {};
  const bad = (field: string) => ({ ok: false as const, error: `"${field}" has an invalid value.` });

  if ("portalAccentColor" in body) {
    const c = cleanAccent(body.portalAccentColor);
    if (!c) return bad("Accent color");
    data.portalAccentColor = c;
  }
  if ("portalLayout" in body) {
    if (!(PORTAL_LAYOUTS as readonly unknown[]).includes(body.portalLayout)) return bad("Layout");
    data.portalLayout = body.portalLayout;
  }
  if ("announcement" in body) {
    const t = cleanText(body.announcement, 280);
    if (t === undefined) return bad("Announcement");
    data.announcement = t || null;
  }
  if ("welcomeMessage" in body) {
    const t = cleanText(body.welcomeMessage, 1000);
    if (t === undefined) return bad("Welcome message");
    data.welcomeMessage = t || null;
  }
  if ("description" in body) {
    const t = cleanText(body.description, 1000);
    if (t === undefined) return bad("Description");
    data.description = t || null;
  }
  for (const [field, max] of [["websiteUrl", 500], ["discordInviteUrl", 500], ["banner", 500], ["icon", 500]] as const) {
    if (field in body) {
      const u = cleanHttpsUrl(body[field], max);
      if (u === undefined) return bad(field);
      data[field] = u;
    }
  }
  if ("showApplicantCount" in body) {
    if (typeof body.showApplicantCount !== "boolean") return bad("Show applicant count");
    data.showApplicantCount = body.showApplicantCount;
  }

  let siteConfig: SiteConfig | undefined;
  if ("siteConfig" in body) {
    const s = body.siteConfig;
    if (!s || typeof s !== "object") return bad("Site options");
    const o = s as Record<string, unknown>;
    if (o.headerStyle !== undefined && !(HEADER_STYLES as readonly unknown[]).includes(o.headerStyle)) return bad("Header style");
    if (o.showReviews !== undefined && typeof o.showReviews !== "boolean") return bad("Show reviews");
    if (o.showHeader !== undefined && typeof o.showHeader !== "boolean") return bad("Show header");
    if (o.showFooter !== undefined && typeof o.showFooter !== "boolean") return bad("Show footer");
    const label = cleanText(o.buttonLabel ?? DEFAULT_SITE_CONFIG.buttonLabel, 30);
    if (!label) return bad("Button label");
    const note = cleanText(o.footerNote ?? "", 160);
    if (note === undefined) return bad("Footer note");
    const seoTitle = cleanText(o.seoTitle ?? "", 70);
    if (seoTitle === undefined) return bad("Page title");
    const seoDescription = cleanText(o.seoDescription ?? "", 200);
    if (seoDescription === undefined) return bad("Page description");
    const headerLinks = o.headerLinks === undefined ? [] : validateLinks(o.headerLinks, MAX_HEADER_LINKS);
    if (!headerLinks) return bad("Header links");
    const footerLinks = o.footerLinks === undefined ? [] : validateLinks(o.footerLinks, MAX_FOOTER_LINKS);
    if (!footerLinks) return bad("Footer links");
    siteConfig = readSiteConfig({
      ...o,
      buttonLabel: label,
      footerNote: note,
      seoTitle,
      seoDescription,
      headerLinks,
      footerLinks,
    });
    data.siteConfig = siteConfig;
  }

  return { ok: true, data, siteConfig };
}
