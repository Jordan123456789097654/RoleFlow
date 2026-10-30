"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Stop = { href: string; selector: string; label: string; title: string; caption: string };

/** Every stop is a section on a page. Right arrow moves down the list, changing page when needed. */
export const TOUR_STEPS: Stop[] = [
  { href: "/", selector: '[data-tour="hero"]', label: "Home", title: "RoleFlow", caption: "One account for every Discord and Roblox community tool. ApplyHub is live today, and Roster is coming soon." },
  { href: "/", selector: '[data-tour="products"]', label: "Products", title: "Our products", caption: "ApplyHub takes applications, lets staff vote with blind quorum, and automates Roblox group promotions and Discord roles. Roster, our staff tool for Roblox groups, is coming soon." },
  { href: "/", selector: '[data-tour="roadmap"]', label: "Roadmap", title: "You decide what we build", caption: "Suggest a feature for your community, then vote on the ideas other communities have posted." },
  { href: "/", selector: '[data-tour="principles"]', label: "Principles", title: "Engineered for community leaders", caption: "One identity across every tool, Roblox and Discord automation, and free forever with no paywalled features." },
  { href: "/", selector: "#newsletter", label: "Newsletter", title: "Stay in the loop", caption: "A monthly brief of releases and new products. Opt-in only, with one-click unsubscribe." },
  { href: "/products", selector: "main h1", label: "Products page", title: "The full lineup", caption: "Every product in one place, with its launch status and how to get started." },
  { href: "/ideas", selector: "main h1", label: "Roadmap page", title: "Suggest and vote", caption: "Post an idea for your community, or vote on the ideas other people have posted." },
  { href: "/blog", selector: "main h1", label: "Updates", title: "Updates and changelog", caption: "Product news, release notes, and engineering posts, all in one place." },
  { href: "/about", selector: "main h1", label: "Our story", title: "Where RoleFlow started", caption: "RoleFlow started as one application tool. Now it is a family of tools under one account, and it stays free forever." },
  { href: "/contact", selector: "main h1", label: "Contact", title: "Get in touch", caption: "Questions, support, and partnerships go to support@roleflow.site. We read every message." },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Automated walkthrough of the parent site for screen shares. Open any page with ?tour=1.
 * Left and right arrows move through the stops; each stop scrolls to its section and highlights it.
 * Escape exits.
 */
export function ParentTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);

  const params = new URLSearchParams(search);
  const enabled = params.get("tour") === "1";

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(TOUR_STEPS.length - 1, Math.max(0, next));
      const step = TOUR_STEPS[clamped];
      const qs = search.replace(/^\?/, "");
      setIndex(clamped);
      if (step.href !== pathname) {
        router.push(qs ? `${step.href}?${qs}` : step.href);
      }
    },
    [router, search, pathname],
  );

  const exit = useCallback(() => {
    const p = new URLSearchParams(search);
    p.delete("tour");
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, search]);

  // Scroll to and highlight the current stop. Waits briefly after a page change so the new page can render.
  useEffect(() => {
    if (!enabled) return;
    const step = TOUR_STEPS[index];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let el: HTMLElement | null = null;
    const timer = setTimeout(() => {
      if (window.location.pathname !== step.href) return;
      document.querySelectorAll(".tour-highlight").forEach((n) => n.classList.remove("tour-highlight"));
      el = document.querySelector<HTMLElement>(step.selector);
      if (el) {
        el.classList.add("tour-highlight");
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      el?.classList.remove("tour-highlight");
    };
  }, [enabled, index, pathname]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Escape") {
        exit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, index, go, exit]);

  if (!enabled) return null;

  const step = TOUR_STEPS[index];
  const percent = ((index + 1) / TOUR_STEPS.length) * 100;

  return (
    <div role="region" aria-label="Website tour" className="fixed inset-x-0 bottom-0 z-[90] pointer-events-none">
      <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-8 sm:pb-8">
        <div className="pointer-events-auto rounded-2xl border border-violet-500/40 bg-[#0b0716]/95 shadow-[0_0_40px_rgba(90,42,162,0.45)] backdrop-blur-md">
          <div className="h-1 w-full overflow-hidden rounded-t-2xl bg-white/5">
            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <div className="p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-violet-300 sm:text-sm">
              {index + 1} of {TOUR_STEPS.length} · {step.label}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{step.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-200 sm:text-2xl">{step.caption}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  disabled={index === 0}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  disabled={index === TOUR_STEPS.length - 1}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
              <p className="text-xs text-slate-500">← → to move · Esc to exit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
