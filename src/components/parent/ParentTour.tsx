"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Stop = {
  chapter: string;
  href: string;
  /** CSS selector for the section to spotlight. */
  selector: string;
  /** Optional: of everything matching `selector`, pick the element whose text contains this. */
  text?: string;
  /** Optional: after finding the element, spotlight its closest ancestor matching this instead. */
  closest?: string;
  label: string;
  title: string;
  /** The headline sentence, shown large. */
  caption: string;
  /** Talking points, revealed one after another under the caption. Keep to two to four. */
  points: string[];
};

/**
 * Every stop is a section on a page. Right arrow moves down the list, changing page when needed.
 * Stops on the same page are grouped so the tour does not bounce back and forth.
 */
export const TOUR_STEPS: Stop[] = [
  // ───────── Welcome ─────────
  {
    chapter: "Welcome",
    href: "/",
    selector: '[data-tour="hero"]',
    label: "Home",
    title: "Welcome to RoleFlow",
    caption: "One account for every Discord and Roblox community tool, built for the people who actually run these communities.",
    points: [
      "Recruitment, rosters, and rank automation, all in one place.",
      "One sign-in carries you across every product.",
      "Every tool is free, with no tiers and no seat limits.",
    ],
  },
  {
    chapter: "Welcome",
    href: "/",
    selector: '[data-tour="search"]',
    label: "Search",
    title: "Find an opening in seconds",
    caption: "The search bar on the front page goes straight to the ApplyHub directory of open positions.",
    points: [
      "Type a position, a Roblox group, or a studio name.",
      "Results come from the live ApplyHub directory.",
      "Applicants build one profile, then reuse it for every community they apply to.",
    ],
  },
  {
    chapter: "Welcome",
    href: "/",
    selector: '[data-tour="ticker"]',
    label: "At a glance",
    title: "The whole pitch in eight phrases",
    caption: "The ticker below the hero sums RoleFlow up before you read a single paragraph.",
    points: [
      "One account, free forever.",
      "Discord roles and Roblox groups, automated.",
      "Blind voting, staff rosters, and shift logs.",
      "Community-built, from the first idea to the latest release.",
    ],
  },

  // ───────── Products ─────────
  {
    chapter: "Products",
    href: "/",
    selector: '[data-tour="products"]',
    label: "Products",
    title: "One account. Every community tool.",
    caption: "Each RoleFlow tool is built from the ground up for speed, privacy, and seamless automation, and all of them share one sign-in.",
    points: [
      "ApplyHub, Roster, and RankHub are all live today.",
      "Every card shows its launch status and a direct way in.",
      "Anything still in testing lets you sign up to be first to try it.",
    ],
  },
  {
    chapter: "Products",
    href: "/",
    selector: '[data-tour="product-applyhub"]',
    label: "ApplyHub",
    title: "ApplyHub: hiring without the chaos",
    caption: "Applicants apply once. Community staff review, vote with blind quorum, and automate Roblox group promotions and Discord roles.",
    points: [
      "Applicants link their Roblox and Discord profiles one time and reuse them everywhere.",
      "Blind voting keeps reviews fair, so the loudest voice does not decide.",
      "Approve someone and their rank and Discord role can follow automatically.",
      "Candidates hear back by bot or email, and every decision lands in an audit log.",
    ],
  },
  {
    chapter: "Products",
    href: "/",
    selector: '[data-tour="product-roster"]',
    label: "Roster",
    title: "Roster: know your whole team",
    caption: "Track staff members, manage department rosters, coordinate training shifts, and keep one unified activity log.",
    points: [
      "Department rosters laid out as clear trees.",
      "Training sessions and shifts scheduled and tracked in one place.",
      "Staff records and a moderation log keep a full history for every member.",
    ],
  },
  {
    chapter: "Products",
    href: "/",
    selector: '[data-tour="product-rankhub"]',
    label: "RankHub",
    title: "RankHub: ranking at full speed",
    caption: "Automated Roblox group ranking through the Open Cloud API or secure bot credentials, with a dry-run engine so nothing surprises you.",
    points: [
      "Run a dry run first to preview every rank change before it happens.",
      "Batch queues handle big changes without clicking through members one by one.",
      "Snapshots and an audit log record what changed and when.",
      "Credentials are stored with AES-256-GCM encryption and never exported raw.",
    ],
  },

  // ───────── Community ─────────
  {
    chapter: "Community",
    href: "/",
    selector: '[data-tour="roadmap"]',
    label: "Roadmap",
    title: "You decide what we build",
    caption: "Suggest features for Discord and Roblox communities, vote on the ideas other people post, and follow the ones that ship.",
    points: [
      "Post an idea built around your own community's needs.",
      "Vote to push the ideas you care about up the list.",
      "Watch an idea go from suggestion to shipped release.",
    ],
  },
  {
    chapter: "Community",
    href: "/",
    selector: '[data-tour="principles"]',
    label: "Principles",
    title: "Engineered for community leaders",
    caption: "Stop stitching together spreadsheets, bot commands, and webhooks. RoleFlow brings those tools together.",
    points: [
      "A single identity across every product.",
      "Roblox and Discord automation that runs by itself.",
      "Free forever, with nothing locked behind a paywall.",
    ],
  },
  {
    chapter: "Community",
    href: "/",
    selector: '[data-tour="principle-0"]',
    label: "Identity",
    title: "A single unified identity",
    caption: "Applicants and staff keep one account across every RoleFlow product.",
    points: [
      "Link Discord or email, then sign in anywhere.",
      "Your profile travels with you into every new tool we launch.",
      "No separate logins for applying, rostering, and ranking.",
    ],
  },
  {
    chapter: "Community",
    href: "/",
    selector: '[data-tour="principle-1"]',
    label: "Automation",
    title: "Roblox and Discord automation",
    caption: "Automate rank changes in your Roblox groups, assign Discord roles on approval, and notify candidates by bot or email.",
    points: [
      "Rank changes happen without staff touching the group page.",
      "Discord roles are assigned the moment someone is approved.",
      "Candidates hear back automatically, so nobody is left wondering.",
    ],
  },
  {
    chapter: "Community",
    href: "/",
    selector: '[data-tour="principle-2"]',
    label: "Free forever",
    title: "100% free, forever",
    caption: "No subscription tiers, no per-seat billing, and no paywalled features.",
    points: [
      "Essential management tools stay free for every community.",
      "No credit card is ever required.",
      "Running costs are kept low by design, so the promise lasts.",
    ],
  },
  {
    chapter: "Community",
    href: "/",
    selector: "#newsletter",
    label: "Newsletter",
    title: "Stay in the loop",
    caption: "One monthly recap of feature releases, new product rollouts, and community spotlights.",
    points: ["Opt-in only.", "One-click unsubscribe in every email.", "One email a month, never more."],
  },

  // ───────── Explore ─────────
  {
    chapter: "Explore",
    href: "/products",
    selector: "h1",
    label: "Products page",
    title: "The full lineup",
    caption: "Every product in one place, with its launch status and how to get started.",
    points: [
      "See what each tool does and who it is for.",
      "Live products link straight through.",
      "Upcoming products offer early access sign-up.",
    ],
  },
  {
    chapter: "Explore",
    href: "/ideas",
    selector: "h1",
    label: "Roadmap page",
    title: "Suggest and vote",
    caption: "This is where the community's ideas live. Post your own, or vote on what other people have posted.",
    points: [
      "Have an idea for the next RoleFlow tool? Post it here.",
      "Browse suggestions and back the ones you want built.",
      "Support from the community helps shape what comes next.",
    ],
  },
  {
    chapter: "Explore",
    href: "/blog",
    selector: "h1",
    label: "Updates",
    title: "Updates and changelog",
    caption: "Product news, release notes, and engineering posts, all in one place.",
    points: [
      "Announcements, and the thinking behind them.",
      "Release notes so you always know what changed.",
      "Write-ups from the people building RoleFlow.",
    ],
  },

  // ───────── About ─────────
  {
    chapter: "About",
    href: "/about",
    selector: "h1",
    label: "Our story",
    title: "Where RoleFlow started",
    caption: "Leading a community takes serious work, but the tools staff rely on have always been fragmented. RoleFlow started there.",
    points: [
      "Built by community managers, for community managers.",
      "It began as one application tool and grew with the people using it.",
      "Now it is a family of tools under one account.",
    ],
  },
  {
    chapter: "About",
    href: "/about",
    selector: "h2",
    text: "The Application Problem",
    closest: ".rounded-3xl",
    label: "The problem",
    title: "The application problem",
    caption: "Recruitment used to mean Google Forms, messy DMs, lost tickets, and hours of cross-referencing profiles and roles.",
    points: [
      "Applicants now create one verified account and link Roblox and Discord once.",
      "Staff get blind voting quorum and automated ranking.",
      "Audit logs and instant group promotion close the loop.",
    ],
  },
  {
    chapter: "About",
    href: "/about",
    selector: "h2",
    text: "Expanding Into a Family",
    closest: ".rounded-3xl",
    label: "The family",
    title: "From one tool to a family",
    caption: "As thousands of applications flowed through, leaders asked for staff trackers, rosters, shift logs, and shared management systems.",
    points: [
      "Instead of one bloated interface, we built focused tools.",
      "ApplyHub handles hiring, vetting, and staffing.",
      "Roster handles member rosters, department trees, and shift tracking.",
    ],
  },
  {
    chapter: "About",
    href: "/about",
    selector: "div",
    text: "Privacy & Respect",
    closest: ".rounded-2xl",
    label: "Privacy",
    title: "Privacy and respect",
    caption: "Essential cookies only. No trackers, no ad networks, and no selling member data.",
    points: [
      "Export your information instantly.",
      "Delete it completely whenever you choose.",
      "You stay in control of what RoleFlow holds about you.",
    ],
  },
  {
    chapter: "About",
    href: "/contact",
    selector: "h1",
    label: "Contact",
    title: "Get in touch",
    caption: "Questions, support, and partnerships go to support@roleflow.site. We read every message.",
    points: [
      "Use the contact page for support questions.",
      "Partnerships with communities and studios are welcome.",
      "Feedback goes straight to the team that builds the tools.",
    ],
  },

  // ───────── Wrap-up ─────────
  {
    chapter: "Wrap-up",
    href: "/",
    selector: '[data-tour="hero"]',
    label: "Wrap-up",
    title: "That is RoleFlow",
    caption: "One account, three live products, and a community that steers the roadmap.",
    points: [
      "Launch ApplyHub to start recruiting today.",
      "Open Roster to organize your staff.",
      "Open RankHub to automate your group ranks.",
    ],
  },
];

/** Chapters in order, with how many stops each holds and where it starts. Drives the segmented progress bar. */
const CHAPTERS = TOUR_STEPS.reduce<{ name: string; count: number; start: number }[]>((acc, step, i) => {
  const last = acc[acc.length - 1];
  if (last && last.name === step.chapter) last.count += 1;
  else acc.push({ name: step.chapter, count: 1, start: i });
  return acc;
}, []);

/** How long auto-play stays on a stop: a base, plus time to read what is on screen. */
function dwellFor(step: Stop): number {
  const words = [step.title, step.caption, ...step.points].join(" ").split(/\s+/).length;
  return Math.min(24000, Math.max(8000, 3500 + words * 320));
}

/** Finds the element a stop points at. Returns null if the page has not rendered it (yet). */
function resolveTarget(step: Stop): HTMLElement | null {
  let el: HTMLElement | null;
  if (step.text) {
    const needle = step.text.toLowerCase();
    // Prefer the deepest match so a wrapper div does not win over the heading inside it.
    const matches = Array.from(document.querySelectorAll<HTMLElement>(step.selector)).filter((n) =>
      (n.textContent ?? "").toLowerCase().includes(needle),
    );
    el = matches[matches.length - 1] ?? null;
  } else {
    el = document.querySelector<HTMLElement>(step.selector);
  }
  if (el && step.closest) el = el.closest<HTMLElement>(step.closest) ?? el;
  return el;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

const POINT_GRID: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Automated walkthrough of the parent site for screen shares. Open any page with ?tour=1.
 *
 *  - A spotlight glides to each section and dims everything else.
 *  - Left and right arrows (or the buttons) move through the stops, changing page when needed.
 *  - Space starts and stops auto-play, which waits long enough on each stop to read it.
 *  - H hides the panel for a clean view of the page. Escape exits.
 */
export function ParentTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const [hidden, setHidden] = useState(false);

  const targetRef = useRef<HTMLElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

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

  // Auto-play reads `go` through a ref so a route change (which gives `go` a new identity) does not restart the timer.
  const goRef = useRef(go);
  goRef.current = go;

  const exit = useCallback(() => {
    const p = new URLSearchParams(search);
    p.delete("tour");
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, search]);

  // Find the current stop's section (waiting for a new page to render if needed) and scroll it into
  // the part of the screen the panel is not covering.
  useEffect(() => {
    if (!enabled) return;
    const step = TOUR_STEPS[index];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    targetRef.current = null;

    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;

    const attempt = () => {
      const onPage = window.location.pathname === step.href;
      const el = onPage ? resolveTarget(step) : null;
      if (!el) {
        // The page may still be loading. Keep looking for about two seconds, then give up and show the top.
        if (++tries < 14) {
          timer = setTimeout(attempt, 150);
        } else if (onPage) {
          window.scrollTo({ top: 0, behavior });
        }
        return;
      }
      targetRef.current = el;

      const topSafe = 76; // clears the site's own header
      const panelH = hidden ? 0 : (panelRef.current?.offsetHeight ?? 0);
      const avail = Math.max(120, window.innerHeight - panelH - topSafe - 20);
      const rect = el.getBoundingClientRect();
      const absTop = rect.top + window.scrollY;
      const top = rect.height <= avail ? absTop - (topSafe + (avail - rect.height) / 2) : absTop - topSafe;
      window.scrollTo({ top: Math.max(0, top), behavior });
    };

    timer = setTimeout(attempt, 350);
    return () => clearTimeout(timer);
  }, [enabled, index, pathname, hidden]);

  // Spotlight: eases toward the target's live position every frame, so it glides between stops and
  // also stays glued to the section while the page scrolls underneath it.
  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reduce ? 1 : 0.16;
    const pad = 14;
    let raf = 0;
    let cur: { x: number; y: number; w: number; h: number } | null = null;

    const tick = () => {
      const node = spotRef.current;
      const el = targetRef.current;
      if (node) {
        if (el && el.isConnected) {
          const r = el.getBoundingClientRect();
          // Keep the ring on screen even when a section is taller than the window.
          const x = Math.max(6, r.left - pad);
          const y = Math.max(6, r.top - pad);
          const w = Math.min(window.innerWidth - 12, r.right + pad) - x;
          const h = Math.min(window.innerHeight - 12, r.bottom + pad) - y;
          const next = { x, y, w: Math.max(40, w), h: Math.max(40, h) };
          cur = cur
            ? {
                x: cur.x + (next.x - cur.x) * ease,
                y: cur.y + (next.y - cur.y) * ease,
                w: cur.w + (next.w - cur.w) * ease,
                h: cur.h + (next.h - cur.h) * ease,
              }
            : next;
          node.style.left = `${cur.x}px`;
          node.style.top = `${cur.y}px`;
          node.style.width = `${cur.w}px`;
          node.style.height = `${cur.h}px`;
          node.style.opacity = "1";
        } else {
          node.style.opacity = "0";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  // Auto-play: wait long enough to read the stop, then move on. Stops at the end.
  useEffect(() => {
    if (!enabled || !auto) return;
    if (index >= TOUR_STEPS.length - 1) {
      setAuto(false);
      return;
    }
    const t = setTimeout(() => goRef.current(index + 1), dwellFor(TOUR_STEPS[index]));
    return () => clearTimeout(t);
  }, [enabled, auto, index]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setAuto(false);
        go(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setAuto(false);
        go(index - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setAuto((a) => !a);
      } else if (e.key === "h" || e.key === "H") {
        setHidden((h) => !h);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "Escape") {
        exit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, index, go, exit]);

  if (!enabled) return null;

  const step = TOUR_STEPS[index];
  const chapterIdx = CHAPTERS.findIndex((c) => c.name === step.chapter);
  const dwell = dwellFor(step);
  const atEnd = index === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Spotlight. Dims the page except for the current section. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[85]">
        <div ref={spotRef} className="tour-spot absolute rounded-2xl opacity-0" />
      </div>

      {hidden ? (
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="fixed bottom-4 right-4 z-[90] rounded-full border border-violet-500/40 bg-[#0b0716]/95 px-4 py-2 font-mono text-xs uppercase tracking-widest text-violet-200 shadow-[0_0_30px_rgba(90,42,162,0.45)] backdrop-blur-md hover:bg-[#130826]"
        >
          Show tour · {index + 1}/{TOUR_STEPS.length} · H
        </button>
      ) : (
        <div role="region" aria-label="Website tour" className="pointer-events-none fixed inset-x-0 bottom-0 z-[90]">
          <div className="mx-auto max-w-5xl px-3 pb-3 sm:px-8 sm:pb-6">
            <div
              ref={panelRef}
              className="pointer-events-auto max-h-[62vh] overflow-y-auto rounded-2xl border border-violet-500/40 bg-[#0b0716]/95 shadow-[0_0_40px_rgba(90,42,162,0.45)] backdrop-blur-md"
            >
              {/* Chapter progress */}
              <div className="flex gap-1 px-3 pt-3 sm:px-5" aria-hidden="true">
                {CHAPTERS.map((c, ci) => {
                  const filled =
                    ci < chapterIdx ? 100 : ci === chapterIdx ? ((index + 1 - c.start) / c.count) * 100 : 0;
                  return (
                    <div key={c.name} className="h-1 overflow-hidden rounded-full bg-white/10" style={{ flex: c.count }} title={c.name}>
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500" style={{ width: `${filled}%` }} />
                    </div>
                  );
                })}
              </div>
              {/* Auto-play countdown for the current stop */}
              <div className="mx-3 mt-1 h-px overflow-hidden bg-transparent sm:mx-5" aria-hidden="true">
                {auto && !atEnd && <div key={`dwell-${index}`} className="tour-dwell h-full bg-white/50" style={{ animationDuration: `${dwell}ms` }} />}
              </div>

              <div key={index} className="p-5 sm:p-8">
                <p className="tour-rise font-mono text-[11px] uppercase tracking-[0.25em] text-violet-300 sm:text-sm">
                  {String(index + 1).padStart(2, "0")} / {TOUR_STEPS.length} · {step.chapter} · {step.label}
                </p>
                <h2 className="tour-rise mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-5xl" style={{ animationDelay: "80ms" }}>
                  {step.title}
                </h2>
                <p className="tour-rise mt-3 text-base leading-relaxed text-slate-200 sm:text-2xl" style={{ animationDelay: "200ms" }}>
                  {step.caption}
                </p>

                <ul className={`mt-5 grid gap-3 ${POINT_GRID[Math.min(4, Math.max(1, step.points.length))]}`}>
                  {step.points.map((point, pi) => (
                    <li
                      key={point}
                      className="tour-rise flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-snug text-slate-200 sm:p-4 sm:text-base"
                      style={{ animationDelay: `${450 + pi * 220}ms` }}
                    >
                      <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuto(false);
                        go(index - 1);
                      }}
                      disabled={index === 0}
                      className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuto(false);
                        go(index + 1);
                      }}
                      disabled={atEnd}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
                    >
                      Next →
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuto((a) => !a)}
                      disabled={atEnd}
                      aria-pressed={auto}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
                        auto ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100" : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {auto ? "⏸ Pause auto-play" : "▶ Auto-play"}
                    </button>
                    {atEnd && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuto(false);
                          go(0);
                        }}
                        className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
                      >
                        ↺ Restart
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">← → move · Space auto-play · H hide · Esc exit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
