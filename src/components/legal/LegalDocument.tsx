import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export type LegalSection = { title: string; paragraphs: (string | string[])[] };

export default function LegalDocument({
  title,
  subtitle,
  updated,
  sections,
}: {
  title: string;
  subtitle: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="page-wrap py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        RoleFlow home
      </Link>

      <div className="mx-auto mt-10 grid max-w-5xl gap-12 lg:grid-cols-[220px_1fr]">
        {/* Contents */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow mb-3">Contents</p>
          <ol className="space-y-2 text-[13px]">
            {sections.map((s, i) => (
              <li key={s.title}>
                <a href={`#${slug(s.title)}`} className="text-ink-2 hover:text-accent">
                  <span className="mr-2 font-mono text-faint">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <article>
          <header className="border-b border-line pb-8">
            <p className="eyebrow mb-4">Legal</p>
            <h1 className="display-lg">{title}</h1>
            <p className="mt-4 text-[17px] text-ink-2">{subtitle}</p>
            <p className="mt-3 font-mono text-[12px] text-faint">Last updated {updated}</p>
          </header>

          <div className="space-y-10 pt-8">
            {sections.map((s, i) => (
              <section key={s.title} id={slug(s.title)} className="scroll-mt-24 space-y-4">
                <h2 className="display-md">
                  <span className="mr-2 font-mono text-[13px] text-faint">{i + 1}.</span>
                  {s.title}
                </h2>
                {s.paragraphs.map((p, j) =>
                  Array.isArray(p) ? (
                    <ul key={j} className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2 marker:text-faint">
                      {p.map((item, k) => <li key={k}>{item}</li>)}
                    </ul>
                  ) : (
                    <p key={j} className="text-[15px] leading-relaxed text-ink-2">{p}</p>
                  )
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function slug(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
