import { prisma } from "@/lib/prisma";
import { DEFAULT_DOCS, DOC_SLUGS, type DocSlug } from "@/lib/site-docs";

/** Stored text for a document, or the built-in default if the founder has not edited it yet. */
export async function getSiteDoc(slug: DocSlug) {
  const row = await prisma.siteDoc.findUnique({ where: { slug } });
  if (row) return { slug, title: row.title, body: row.body, updatedAt: row.updatedAt.toISOString(), stored: true };
  return { slug, ...DEFAULT_DOCS[slug], updatedAt: null, stored: false };
}

export async function listSiteDocs() {
  return Promise.all(DOC_SLUGS.map((s) => getSiteDoc(s)));
}

export function isDocSlug(v: string): v is DocSlug {
  return (DOC_SLUGS as readonly string[]).includes(v);
}
