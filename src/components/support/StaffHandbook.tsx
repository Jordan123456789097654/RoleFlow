"use client";

import { useEffect, useState } from "react";
import { DEFAULT_DOCS, parseDoc, type DocSlug, type DocSection } from "@/lib/site-docs";

const card = "rounded-2xl border border-line bg-surface p-5 space-y-3";

function DocView({ slug, heading, intro }: { slug: DocSlug; heading: string; intro: string }) {
  const [sections, setSections] = useState<DocSection[]>(() => parseDoc(DEFAULT_DOCS[slug].body));
  const [updated, setUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/support/docs?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setSections(parseDoc(d.body));
        setUpdated(d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : null);
      })
      .catch(() => {});
  }, [slug]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ink">{heading}</h2>
        <p className="text-xs text-muted mt-1">{intro}{updated ? ` Last updated ${updated}.` : ""}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s, i) => (
          <section key={`${i}-${s.heading}`} className={card}>
            {s.heading && <h3 className="text-sm font-bold text-ink">{s.heading}</h3>}
            {s.blocks.map((b, j) =>
              b.kind === "ul" ? (
                <ul key={j} className="list-disc pl-5 space-y-1.5 text-xs text-ink-2">
                  {b.items.map((it, k) => <li key={k}>{it}</li>)}
                </ul>
              ) : (
                b.items.map((p, k) => <p key={`${j}-${k}`} className="text-xs text-ink-2">{p}</p>)
              )
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export default function StaffHandbook() {
  return (
    <div className="space-y-10">
      <DocView slug="support-handbook" heading="Support staff handbook" intro="The procedures for this panel. Read it before your first shift and when a case is unclear." />
      <DocView slug="documentation" heading="Staff documentation" intro="General references for support staff." />
    </div>
  );
}
