import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation | ApplyHub by RoleFlow",
  description: "How to use every part of ApplyHub: applying, tracking applications, running a community, and account settings.",
};

import { getDocGroups } from "@/lib/docs-page";
import type { DocSection as Section, DocGroup as Group } from "@/lib/docs-content";

function Block({ section, index }: { section: Section; index: number }) {
  return (
    <section id={section.id} className="scroll-mt-24 space-y-4">
      <h3 className="display-md">
        <span className="mr-2 font-mono text-[13px] text-faint">{index}.</span>
        {section.title}
      </h3>
      {section.intro && <p className="text-[15px] leading-relaxed text-ink-2">{section.intro}</p>}
      {section.steps && (
        <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2 marker:text-faint">
          {section.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
      {section.body?.map((p) => (
        <p key={p} className="text-[15px] leading-relaxed text-ink-2">
          {p}
        </p>
      ))}
      {section.tips && (
        <div className="card space-y-2 p-5">
          <p className="eyebrow">Tips</p>
          <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink-2 marker:text-faint">
            {section.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const { groups } = await getDocGroups();
  return (
    <div className="page-wrap py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        RoleFlow home
      </Link>

      <div className="mx-auto mt-10 grid max-w-5xl gap-12 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
          <nav aria-label="Documentation contents" className="space-y-2">
            {groups.map((g, gi) => {
              const start = groups.slice(0, gi).reduce((n, x) => n + x.sections.length, 0);
              return (
                <details key={g.title} open={gi === 0} className="group rounded-lg">
                  <summary className="eyebrow flex cursor-pointer select-none list-none items-center justify-between py-2">
                    {g.title}
                    <span className="font-mono text-faint transition-transform group-open:rotate-90">›</span>
                  </summary>
                  <ol className="space-y-1.5 pb-3 pl-1 text-[13px]">
                    {g.sections.map((s, i) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="block rounded-md px-2 py-1 text-ink-2 hover:bg-sunk hover:text-accent">
                          <span className="mr-2 font-mono text-faint">{String(start + i + 1).padStart(2, "0")}</span>
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </details>
              );
            })}
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="border-b border-line pb-8">
            <p className="eyebrow mb-4">Documentation</p>
            <h1 className="display-lg">ApplyHub Documentation</h1>
            <p className="mt-4 text-[17px] text-ink-2">
              How to apply to communities, run one, and use each part of ApplyHub.
            </p>
          </header>

          <div className="space-y-16 pt-8">
            {groups.map((g) => {
              const start = groups.slice(0, groups.indexOf(g)).reduce((n, x) => n + x.sections.length, 0);
              return (
                <div key={g.title} className="space-y-10">
                  <h2 className="eyebrow border-b border-line pb-2">{g.title}</h2>
                  {g.sections.map((s, i) => (
                    <Block key={s.id} section={s} index={start + i + 1} />
                  ))}
                </div>
              );
            })}
          </div>

          <p className="mt-16 text-[13px] text-muted">
            Still stuck?{" "}
            <Link href="/support" className="text-accent hover:underline">
              Contact support
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
