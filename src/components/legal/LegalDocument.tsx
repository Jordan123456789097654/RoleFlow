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
    <div className="min-h-screen bg-[#08090d] py-16 text-slate-100 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to RoleFlow
        </Link>

        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <span className="font-mono text-xs uppercase tracking-widest text-violet-400">
              Contents
            </span>
            <ol className="mt-4 space-y-2.5 text-xs font-medium">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <a
                    href={`#${slug(s.title)}`}
                    className="flex items-center text-slate-400 transition-colors hover:text-white"
                  >
                    <span className="mr-2 font-mono text-slate-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          {/* Main Legal Document Article */}
          <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-md sm:p-12">
            <header className="border-b border-white/10 pb-8">
              <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                Official Legal Document
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-3 text-base font-medium text-violet-300 sm:text-lg">
                {subtitle}
              </p>
              <p className="mt-2 font-mono text-xs text-slate-400">
                Last updated: {updated}
              </p>
            </header>

            <div className="space-y-12 pt-10">
              {sections.map((s, i) => (
                <section key={s.title} id={slug(s.title)} className="scroll-mt-28 space-y-4">
                  <h2 className="flex items-baseline gap-2 text-xl font-bold text-white sm:text-2xl">
                    <span className="font-mono text-sm font-semibold text-violet-400">
                      {i + 1}.
                    </span>
                    {s.title}
                  </h2>
                  <div className="space-y-3">
                    {s.paragraphs.map((p, j) =>
                      Array.isArray(p) ? (
                        <ul
                          key={j}
                          className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-slate-300 marker:text-violet-400 sm:text-base"
                        >
                          {p.map((item, k) => (
                            <li key={k}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p
                          key={j}
                          className="text-sm leading-relaxed text-slate-300 sm:text-base"
                        >
                          {p}
                        </p>
                      )
                    )}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function slug(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
