"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PolicyNoticePanel from "@/components/founder/PolicyNoticePanel";
import BulkEmailPanel from "@/components/founder/BulkEmailPanel";
import EmergencyPanel from "@/components/founder/EmergencyPanel";
import DocsEditor from "@/components/founder/DocsEditor";
import DocsPageEditor from "@/components/founder/DocsPageEditor";
import PollsPanel from "@/components/founder/PollsPanel";

type Card = { href: string; title: string; desc: string };
type Section = { title: string; intro: string; cards: Card[] };

const SECTIONS: Section[] = [
  {
    title: "Policies and legal",
    intro: "The five public policy pages. Edits go live on save, and every previous version can be restored.",
    cards: [
      { href: "/founder/policies", title: "Policy editor", desc: "Edit the title, dates, and every section of each policy." },
      { href: "/privacy", title: "Public policy pages", desc: "Open the pages the way visitors see them." },
    ],
  },
];

export default function FounderConsolePage() {
  const [denied, setDenied] = useState(false);
  const [customisedPolicies, setCustomisedPolicies] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/founder/policies")
      .then(async (res) => {
        if (res.status === 403) return setDenied(true);
        const data = await res.json();
        setCustomisedPolicies(data.policies.filter((p: any) => p.customised).length);
      })
      .catch(() => {});
  }, []);

  if (denied) {
    return (
      <div className="page-wrap py-16">
        <p className="eyebrow mb-3">Founder</p>
        <h1 className="display-md">Founder Master Command Console</h1>
        <p className="mt-4 text-sm text-muted">Only the platform founder can open this console.</p>
      </div>
    );
  }

  return (
    <div className="page-wrap py-12 sm:py-16 space-y-10">
      <div>
        <p className="eyebrow mb-3">Founder</p>
        <h1 className="display-md">Founder Master Command Console</h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">Founder-only tools. For day-to-day administration, use the admin console. For reports, use the support panel.</p>
      </div>

      <PolicyNoticePanel />

      <EmergencyPanel />

      <DocsEditor />
      <DocsPageEditor />
      <PollsPanel />
      <BulkEmailPanel />

      <Link href="/founder/policies" className="glass-panel p-5 rounded-2xl space-y-1 transition-colors hover:border-accent block">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Policies with custom text</p>
        <p className="font-display text-3xl text-ink">{customisedPolicies ?? "-"}</p>
        <p className="text-[12px] text-muted">Built-in text is used for any policy not listed here.</p>
      </Link>

      {SECTIONS.map((s) => (
        <section key={s.title} className="space-y-4">
          <div>
            <h2 className="display-sm">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.intro}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.cards.map((c) => (
              <Link key={c.href} href={c.href} className="glass-panel p-5 rounded-2xl space-y-2 transition-colors hover:border-accent">
                <p className="text-sm font-semibold text-ink">{c.title}</p>
                <p className="text-[12px] text-muted">{c.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
