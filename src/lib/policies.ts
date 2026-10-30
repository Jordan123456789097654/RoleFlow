import { prisma } from "@/lib/prisma";
import { POLICY_DEFAULTS } from "@/lib/policy-defaults";

export type PolicySection = { title: string; paragraphs: (string | string[])[] };
export type PolicyData = { title: string; subtitle: string; updated: string; sections: PolicySection[] };

export const POLICY_SLUGS = ["privacy", "terms", "acceptable-use", "community-guidelines", "cookies"] as const;

export function isPolicySlug(v: string): boolean {
  return (POLICY_SLUGS as readonly string[]).includes(v);
}

/** The stored override if there is a valid one, otherwise the built-in default. */
export async function getPolicy(slug: string): Promise<PolicyData> {
  const fallback = POLICY_DEFAULTS[slug];
  try {
    const row = await prisma.policyDocument.findUnique({ where: { slug } });
    if (!row) return fallback;
    const sections = validateSections(JSON.parse(row.sectionsJson));
    if (typeof sections === "string") return fallback;
    return { title: row.title, subtitle: row.subtitle, updated: row.updated, sections };
  } catch {
    return fallback;
  }
}

export function validateSections(input: any): PolicySection[] | string {
  if (!Array.isArray(input) || input.length === 0) return "Add at least one section.";
  if (input.length > 60) return "Too many sections (60 maximum).";
  const out: PolicySection[] = [];
  for (const s of input) {
    if (!s || typeof s.title !== "string" || !s.title.trim()) return "Every section needs a title.";
    if (s.title.length > 200) return "Section titles must be 200 characters or fewer.";
    if (!Array.isArray(s.paragraphs) || s.paragraphs.length === 0) return `"${s.title}" needs at least one paragraph.`;
    const paragraphs: (string | string[])[] = [];
    for (const p of s.paragraphs) {
      if (typeof p === "string" && p.trim()) paragraphs.push(p.trim());
      else if (Array.isArray(p) && p.length && p.every((x) => typeof x === "string")) paragraphs.push(p.map((x: string) => x.trim()));
      else return `"${s.title}" has an invalid paragraph.`;
    }
    out.push({ title: s.title.trim(), paragraphs });
  }
  return out;
}

export function validatePolicyBody(body: any): PolicyData | string {
  const title = String(body?.title ?? "").trim();
  const subtitle = String(body?.subtitle ?? "").trim();
  const updated = String(body?.updated ?? "").trim();
  if (!title || title.length > 200) return "A title is required (200 characters or fewer).";
  if (!subtitle || subtitle.length > 400) return "A subtitle is required (400 characters or fewer).";
  if (!updated || updated.length > 80) return "A last-updated date is required.";
  const sections = validateSections(body?.sections);
  if (typeof sections === "string") return sections;
  return { title, subtitle, updated, sections };
}
