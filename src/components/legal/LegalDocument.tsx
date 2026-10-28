import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

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
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to RoleFlow Home
      </Link>
      <div className="border border-white/10 rounded-3xl bg-surface/90 backdrop-blur-xl p-6 sm:p-12 shadow-2xl space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            <p className="text-[11px] text-slate-500 mt-1">Last updated: {updated}</p>
          </div>
        </div>
        <nav className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300 mb-1">Contents</p>
          <ol className="list-decimal pl-5 space-y-0.5">
            {sections.map((s) => (
              <li key={s.title}><a href={`#${slug(s.title)}`} className="hover:text-purple-300">{s.title}</a></li>
            ))}
          </ol>
        </nav>
        {sections.map((s, i) => (
          <section key={s.title} id={slug(s.title)} className="space-y-3 scroll-mt-24">
            <h2 className="text-base font-bold text-white">{i + 1}. {s.title}</h2>
            {s.paragraphs.map((p, j) =>
              Array.isArray(p) ? (
                <ul key={j} className="list-disc pl-5 space-y-1.5 text-sm text-slate-300 leading-relaxed">
                  {p.map((item, k) => <li key={k}>{item}</li>)}
                </ul>
              ) : (
                <p key={j} className="text-sm text-slate-300 leading-relaxed">{p}</p>
              )
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function slug(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
