/**
 * Applies the policy text in /policies to the database.
 *
 * Runs on every build. It does nothing when policies/VERSION matches the version already stored,
 * so text the founder edits on the site is not overwritten by later builds. To publish new text
 * from the repository, change policies/VERSION. The previous text is kept as a revision.
 *
 * Fails the build if a policy file is missing or invalid, so an old policy is never published silently.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";

const SLUGS = ["privacy", "terms", "acceptable-use", "community-guidelines", "cookies"] as const;
const DIR = path.resolve(process.cwd(), "policies");
const SETTING_KEY = "policy_seed_version";
const EDITOR_ID = "deploy-sync";

type Section = { title: string; paragraphs: (string | string[])[] };
type Policy = { title: string; subtitle: string; updated: string; sections: Section[] };

function validate(slug: string, d: any): Policy {
  const fail = (msg: string) => { throw new Error(`policies/${slug}.json: ${msg}`); };
  if (typeof d?.title !== "string" || !d.title.trim()) fail("title is required");
  if (typeof d?.subtitle !== "string" || !d.subtitle.trim()) fail("subtitle is required");
  if (typeof d?.updated !== "string" || !d.updated.trim()) fail("updated is required");
  if (!Array.isArray(d.sections) || d.sections.length === 0) fail("sections must be a non-empty list");
  for (const s of d.sections) {
    if (typeof s?.title !== "string" || !s.title.trim()) fail("every section needs a title");
    if (!Array.isArray(s.paragraphs) || s.paragraphs.length === 0) fail(`"${s.title}" needs paragraphs`);
    for (const p of s.paragraphs) {
      const ok = (typeof p === "string" && p.trim()) || (Array.isArray(p) && p.length && p.every((x: unknown) => typeof x === "string"));
      if (!ok) fail(`"${s.title}" has an invalid paragraph`);
    }
  }
  return { title: d.title, subtitle: d.subtitle, updated: d.updated, sections: d.sections };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const version = readFileSync(path.join(DIR, "VERSION"), "utf8").trim();
    const current = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEY } });
    if (current?.value === version) {
      console.log(`[policies] Already at ${version}. Nothing to change.`);
      return;
    }

    // Validate everything before writing anything.
    const policies = SLUGS.map((slug) => ({
      slug,
      data: validate(slug, JSON.parse(readFileSync(path.join(DIR, `${slug}.json`), "utf8"))),
    }));

    for (const { slug, data } of policies) {
      const existing = await prisma.policyDocument.findUnique({ where: { slug } });
      if (existing) {
        await prisma.policyRevision.create({
          data: {
            slug,
            title: existing.title,
            subtitle: existing.subtitle,
            updated: existing.updated,
            sectionsJson: existing.sectionsJson,
            editorId: EDITOR_ID,
          },
        });
      }
      const row = {
        title: data.title,
        subtitle: data.subtitle,
        updated: data.updated,
        sectionsJson: JSON.stringify(data.sections),
        updatedById: EDITOR_ID,
      };
      await prisma.policyDocument.upsert({ where: { slug }, create: { slug, ...row }, update: row });
      console.log(`[policies] ${slug}: ${data.sections.length} sections`);
    }

    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: version },
      update: { value: version },
    });
    console.log(`[policies] Published version ${version}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[policies] Sync failed:", err.message);
  process.exit(1);
});
