"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";

interface FeedbackItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity?: string | null;
  category?: string | null;
  status: string;
  authorName?: string | null;
  adminNotes?: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<"bugs" | "suggestions" | "submit">("bugs");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Form State
  const [formType, setFormType] = useState<"BUG_REPORT" | "FEATURE_SUGGESTION">("BUG_REPORT");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("UI");
  const [formSeverity, setFormSeverity] = useState("NORMAL");
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  async function fetchFeedback() {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          title: formTitle.trim(),
          description: formDesc.trim(),
          category: formCategory,
          severity: formSeverity,
          guestName: guestName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(
          formType === "BUG_REPORT"
            ? "Bug report submitted. The support team has logged it."
            : "Suggestion submitted. Thanks for helping shape RoleFlow."
        );
        setTimeout(() => setSuccessMsg(null), 5000);
        setFormTitle("");
        setFormDesc("");
        setActiveTab(formType === "BUG_REPORT" ? "bugs" : "suggestions");
        fetchFeedback();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const bugs = items.filter((i) => i.type === "BUG_REPORT");
  const suggestions = items.filter((i) => i.type === "FEATURE_SUGGESTION");
  const currentList = activeTab === "bugs" ? bugs : suggestions;
  const filteredList =
    statusFilter === "ALL"
      ? currentList
      : currentList.filter((i) => i.status === statusFilter);

  const tabClass = (on: boolean) =>
    cn(
      "relative -mb-px pb-3 text-[15px] transition-colors",
      on ? "font-medium text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-accent" : "text-muted hover:text-ink"
    );

  return (
    <div className="page-wrap space-y-10 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        RoleFlow home
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Beta feedback</p>
          <h1 className="display-lg">Bugs and ideas, in one place.</h1>
          <p className="lede mt-4">Report something that is broken, follow how it is being handled, or suggest what should come next.</p>
        </div>
        <button type="button" onClick={() => setActiveTab("submit")} className="btn-accent shrink-0">
          <Plus className="h-4 w-4" />
          New report
        </button>
      </header>

      {successMsg && (
        <div role="status" className="flex items-center gap-2 rounded-md border border-moss bg-moss-soft px-4 py-3 text-[14px] text-moss-ink animate-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs and filter */}
      <div className="flex flex-col gap-4 border-b border-line sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-7">
          <button type="button" onClick={() => setActiveTab("bugs")} className={tabClass(activeTab === "bugs")}>
            Bug reports <span className="ml-1 font-mono text-[13px] text-faint tabular-nums">{bugs.length}</span>
          </button>
          <button type="button" onClick={() => setActiveTab("suggestions")} className={tabClass(activeTab === "suggestions")}>
            Suggestions <span className="ml-1 font-mono text-[13px] text-faint tabular-nums">{suggestions.length}</span>
          </button>
          <button type="button" onClick={() => setActiveTab("submit")} className={tabClass(activeTab === "submit")}>
            Submit new
          </button>
        </div>

        {activeTab !== "submit" && (
          <div className="flex items-center gap-2 pb-3">
            <label htmlFor="status-filter" className="font-mono text-[11px] uppercase tracking-wider text-muted">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="field field-sm w-auto"
            >
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        )}
      </div>

      {/* Submission form */}
      {activeTab === "submit" && (
        <form onSubmit={handleSubmit} className="card max-w-3xl space-y-7 p-6 sm:p-10">
          <div>
            <h2 className="display-md">{formType === "BUG_REPORT" ? "File a bug report" : "Suggest a feature"}</h2>
            <p className="mt-2 text-[14px] text-muted">Specific details help the team reproduce and fix things faster.</p>
          </div>

          {/* Type toggle */}
          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <legend className="sr-only">Type of submission</legend>
            {[
              { value: "BUG_REPORT" as const, title: "Bug report", desc: "Something is broken or behaves unexpectedly." },
              { value: "FEATURE_SUGGESTION" as const, title: "Feature suggestion", desc: "An idea for a new capability or workflow." },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={formType === opt.value}
                onClick={() => setFormType(opt.value)}
                className={cn(
                  "rounded-md border p-4 text-left transition-colors",
                  formType === opt.value ? "border-ink bg-ink text-paper" : "border-line-strong hover:border-ink"
                )}
              >
                <span className="block font-medium">{opt.title}</span>
                <span className={cn("mt-1 block text-[13px]", formType === opt.value ? "text-paper/75" : "text-muted")}>{opt.desc}</span>
              </button>
            ))}
          </fieldset>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fb-title" className="label">Summary</label>
              <input
                id="fb-title"
                type="text"
                required
                placeholder={formType === "BUG_REPORT" ? "e.g. Discord role not granted on acceptance" : "e.g. Bulk-reject applicants from the list"}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="fb-category" className="label">Area</label>
              <select id="fb-category" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="field">
                <option value="UI">Interface and layout</option>
                <option value="DISCORD_BOT">Discord bot</option>
                <option value="FORM_BUILDER">Form builder and logic</option>
                <option value="ROBLOX">Roblox verification</option>
                <option value="PERMISSIONS">Staff permissions</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="OTHER">Something else</option>
              </select>
            </div>
          </div>

          {formType === "BUG_REPORT" && (
            <fieldset>
              <legend className="label">Severity</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["LOW", "NORMAL", "HIGH", "CRITICAL"].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    aria-pressed={formSeverity === sev}
                    onClick={() => setFormSeverity(sev)}
                    className={cn(
                      "rounded-md border py-2.5 font-mono text-[12px] uppercase tracking-wide transition-colors",
                      formSeverity === sev ? "border-ink bg-ink text-paper" : "border-line-strong text-ink-2 hover:border-ink"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor="fb-desc" className="label">
              Details {formType === "BUG_REPORT" && "and steps to reproduce"}
            </label>
            <textarea
              id="fb-desc"
              rows={5}
              required
              placeholder={
                formType === "BUG_REPORT"
                  ? "1. Open the community dashboard\n2. Accept applicant #12\n3. The Discord bot returned error 50001"
                  : "Describe the situation and how this would help your community."
              }
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="field resize-y"
            />
          </div>

          <div>
            <label htmlFor="fb-name" className="label">
              Name or Discord tag <span className="font-normal text-faint">(optional, for follow-up)</span>
            </label>
            <input
              id="fb-name"
              type="text"
              placeholder="e.g. jordan#0001"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="field"
            />
          </div>

          <div className="flex items-center justify-end border-t border-line pt-6">
            <button type="submit" disabled={submitting} className="btn-accent btn-lg">
              {submitting ? "Submitting…" : formType === "BUG_REPORT" ? "Submit bug report" : "Submit suggestion"}
            </button>
          </div>
        </form>
      )}

      {/* Feedback list */}
      {activeTab !== "submit" && (
        <div>
          {loading ? (
            <p className="py-16 text-center text-[14px] text-muted">Loading…</p>
          ) : filteredList.length === 0 ? (
            <div className="card px-6 py-16 text-center">
              <p className="display-md text-[24px]">Nothing here yet</p>
              <p className="mx-auto mt-2 max-w-sm text-[14px] text-muted">
                No {activeTab === "bugs" ? "bug reports" : "suggestions"} match this view.
              </p>
              <button type="button" onClick={() => setActiveTab("submit")} className="btn-ghost mt-6">
                Submit the first one
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {filteredList.map((item) => (
                <li key={item.id} className="space-y-4 py-7">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "badge",
                          item.status === "RESOLVED" ? "badge-moss" : item.status === "UNDER_REVIEW" ? "badge-accent" : item.status === "DISMISSED" ? "badge-neutral" : "badge-gold"
                        )}
                      >
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                      {item.severity && item.type === "BUG_REPORT" && (
                        <span className={cn("badge", item.severity === "CRITICAL" ? "badge-danger" : item.severity === "HIGH" ? "badge-gold" : "badge-neutral")}>
                          {item.severity}
                        </span>
                      )}
                      <span className="chip">{item.category || "General"}</span>
                    </div>
                    <span className="font-mono text-[12px] text-faint">
                      {item.authorName || "Member"} · {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-[22px] leading-snug text-ink">{item.title}</h3>
                    <p className="mt-2 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">{item.description}</p>
                  </div>

                  {item.adminNotes && (
                    <div className="max-w-3xl border-l-2 border-moss bg-moss-soft/60 px-4 py-3">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-moss-ink">Team update</p>
                      <p className="mt-1 whitespace-pre-wrap text-[14px] text-ink-2">{item.adminNotes}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
