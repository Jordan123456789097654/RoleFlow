import { prisma } from "@/lib/prisma";
import { DEFAULT_DOC_GROUPS, type DocGroup, type DocSection } from "@/lib/docs-content";

export const DOCS_KEY = "public-docs";
const MAX_GROUPS = 30;
const MAX_SECTIONS = 80;
const MAX_ITEMS = 60;
const MAX_TEXT = 2000;
const ID_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

/** Checks a documentation structure from the founder editor. Returns a clean copy or the first problem found. */
export function validateDocGroups(input: unknown): { ok: true; groups: DocGroup[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: "Add at least one group." };
  if (input.length > MAX_GROUPS) return { ok: false, error: `Use at most ${MAX_GROUPS} groups.` };

  const seen = new Set<string>();
  let sectionCount = 0;
  const groups: DocGroup[] = [];

  const text = (v: unknown, label: string, max: number, required: boolean): string | { error: string } => {
    const t = typeof v === "string" ? v.trim() : "";
    if (required && !t) return { error: `${label} cannot be empty.` };
    if (t.length > max) return { error: `${label} must be ${max} characters or fewer.` };
    return t;
  };
  const list = (v: unknown, label: string): string[] | { error: string } | undefined => {
    if (v === undefined || v === null) return undefined;
    if (!Array.isArray(v)) return { error: `${label} must be a list.` };
    if (v.length > MAX_ITEMS) return { error: `${label} can have at most ${MAX_ITEMS} entries.` };
    const items: string[] = [];
    for (const raw of v) {
      const t = typeof raw === "string" ? raw.trim() : "";
      if (!t) continue;
      if (t.length > MAX_TEXT) return { error: `${label} entries must be ${MAX_TEXT} characters or fewer.` };
      items.push(t);
    }
    return items.length ? items : undefined;
  };

  for (const g of input as any[]) {
    const gTitle = text(g?.title, "Group title", 120, true);
    if (typeof gTitle !== "string") return { ok: false, error: gTitle.error };
    if (!Array.isArray(g?.sections)) return { ok: false, error: `"${gTitle}" needs a sections list.` };
    const sections: DocSection[] = [];
    for (const s of g.sections) {
      sectionCount++;
      if (sectionCount > MAX_SECTIONS) return { ok: false, error: `Use at most ${MAX_SECTIONS} sections.` };
      const id = typeof s?.id === "string" ? s.id.trim() : "";
      if (!ID_RE.test(id)) return { ok: false, error: `Section ID "${id}" must use lowercase letters, numbers and hyphens.` };
      if (seen.has(id)) return { ok: false, error: `Section ID "${id}" is used more than once.` };
      seen.add(id);
      const title = text(s?.title, `Section "${id}" title`, 160, true);
      if (typeof title !== "string") return { ok: false, error: title.error };
      const intro = text(s?.intro, `Section "${id}" intro`, MAX_TEXT, false);
      if (typeof intro !== "string") return { ok: false, error: intro.error };
      const steps = list(s?.steps, `Section "${id}" steps`);
      const body = list(s?.body, `Section "${id}" paragraphs`);
      const tips = list(s?.tips, `Section "${id}" tips`);
      for (const r of [steps, body, tips]) if (r && !Array.isArray(r)) return { ok: false, error: r.error };
      sections.push({
        id, title,
        ...(intro ? { intro } : {}),
        ...(Array.isArray(steps) ? { steps } : {}),
        ...(Array.isArray(body) ? { body } : {}),
        ...(Array.isArray(tips) ? { tips } : {}),
      });
    }
    groups.push({ title: gTitle, sections });
  }
  return { ok: true, groups };
}

/** The saved documentation, or the built-in default if none has been saved (or the saved copy is unreadable). */
export async function getDocGroups(): Promise<{ groups: DocGroup[]; customised: boolean; updatedAt: string | null }> {
  const row = await prisma.docsPage.findUnique({ where: { key: DOCS_KEY } });
  if (row) {
    try {
      const check = validateDocGroups(JSON.parse(row.groupsJson));
      if (check.ok) return { groups: check.groups, customised: true, updatedAt: row.updatedAt.toISOString() };
    } catch {
      /* fall through to the default */
    }
  }
  return { groups: DEFAULT_DOC_GROUPS, customised: false, updatedAt: null };
}
