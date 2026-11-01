/**
 * The script for the launch intro. Edit the words, pacing, and acts here.
 * UnveilIntro.tsx only knows how to play whatever is in this file.
 *
 * Timing per beat = typing (text.length * speed) + 200ms settle + hold + FADE_MS.
 */

export type BeatKind = "text" | "terminal" | "chapter";

export type Beat = {
  /** Index into ACTS. Drives the corner label, the progress pips, and the glow colour. */
  act: number;
  /** What gets typed. For terminal beats, "\n" separates lines. */
  text: string;
  className: string;
  /** How long the finished line stays on screen, in ms. */
  hold: number;
  /** Milliseconds per typed character. */
  speed: number;
  kind?: BeatKind;
  /** Smaller line that fades in under the main line once it has finished typing. */
  sub?: string;
  subClassName?: string;
  /** "flash" whites the screen out as the beat starts. "glitch" jitters the finished line. */
  fx?: "flash" | "glitch";
};

export type Act = { name: string; glowA: string; glowB: string };

export const ACTS: Act[] = [
  { name: "Boot", glowA: "rgb(16 185 129)", glowB: "rgb(13 148 136)" },
  { name: "The problem", glowA: "rgb(100 116 139)", glowB: "rgb(190 60 90)" },
  { name: "The rebuild", glowA: "rgb(139 92 246)", glowB: "rgb(217 70 239)" },
  { name: "The promise", glowA: "rgb(129 140 248)", glowB: "rgb(232 121 249)" },
  { name: "The reveal", glowA: "rgb(167 139 250)", glowB: "rgb(255 255 255)" },
];

/**
 * One dial for the whole intro. 1 is the full cut (about 2m45s). 0.8 is about 2m15s.
 * 1.2 is a slower, more dramatic read. Applies to typing speed and hold time.
 */
export const PACE = 1;

export const FADE_MS = 500;
/** Pause between the last character and the hold timer starting. Matches UnveilIntro. */
export const SETTLE_MS = 200;

// Shared class strings so the script below stays readable.
const MONO_DIM = "font-mono text-sm text-slate-400 sm:text-base";
const SANS_DIM = "font-sans text-lg text-slate-400 sm:text-2xl";
const SANS_WHITE = "font-sans text-xl font-semibold text-white sm:text-3xl";
const SERIF_SOFT = "font-serif text-2xl italic text-slate-300 sm:text-4xl";
const SUB = "font-sans text-sm text-slate-400 sm:text-lg";
const SUB_VIOLET = "font-sans text-sm text-violet-300 sm:text-lg";
const CHAPTER = "font-mono text-xs uppercase tracking-[0.6em] text-slate-500 sm:text-sm";
const CHAPTER_SUB = "font-sans text-3xl font-extrabold tracking-tight text-white sm:text-5xl";
const PRODUCT = "font-sans text-5xl font-black tracking-tight text-white sm:text-7xl";

function chapter(act: number, label: string, title: string): Beat {
  return { act, kind: "chapter", text: label, className: CHAPTER, sub: title, subClassName: CHAPTER_SUB, speed: 90, hold: 1500 };
}

export const BEATS: Beat[] = [
  // ───────── Act 0: Boot ─────────
  {
    act: 0,
    kind: "terminal",
    text: [
      "> boot roleflow.core v2.0",
      "> checking environment ........ ok",
      "> unified identity ............ ok",
      "> discord gateway ............. ok",
      "> roblox open cloud ........... ok",
    ].join("\n"),
    className: "",
    speed: 20,
    hold: 500,
  },
  {
    act: 0,
    kind: "terminal",
    text: [
      "> loading applyhub ............ ok",
      "> loading roster .............. ok",
      "> loading rankhub ............. ok",
      "> syncing communities ......... ok",
      "> verifying audit trail ....... ok",
      "> cutover status: READY",
    ].join("\n"),
    className: "",
    speed: 20,
    hold: 1100,
  },

  // ───────── Act 1: The problem ─────────
  chapter(1, "ACT I", "The problem"),
  { act: 1, text: "Every community deserves better tools.", className: SERIF_SOFT, speed: 55, hold: 1600, sub: "Because running one is real work.", subClassName: SUB },
  { act: 1, text: "It starts with a Google Form.", className: SANS_DIM, speed: 42, hold: 1100 },
  { act: 1, text: "Then the Discord DMs pile up.", className: SANS_DIM, speed: 42, hold: 1100 },
  { act: 1, text: "Tickets get lost. Roles get missed.", className: SANS_DIM, speed: 42, hold: 1200 },
  { act: 1, text: "Someone re-checks every Roblox profile by hand.", className: SANS_DIM, speed: 40, hold: 1300 },
  { act: 1, text: "Hundreds of hours of applications.", className: SANS_DIM, speed: 40, hold: 1000 },
  { act: 1, text: "Hundreds of hours of rank changes.", className: SANS_DIM, speed: 40, hold: 1000 },
  { act: 1, text: "Hundreds of hours of staff shifts.", className: SANS_DIM, speed: 40, hold: 1200 },
  { act: 1, text: "All of it stitched together with spreadsheets, bot commands, and hope.", className: "font-sans text-lg text-slate-300 sm:text-2xl", speed: 36, hold: 1800 },
  { act: 1, text: "That time belongs to your community.", className: SANS_WHITE, speed: 48, hold: 1500, sub: "Not to busywork.", subClassName: SUB },

  // ───────── Act 2: The rebuild ─────────
  chapter(2, "ACT II", "The rebuild"),
  { act: 2, text: "So we rebuilt all of it.", className: SANS_WHITE, speed: 50, hold: 1300, sub: "From the ground up.", subClassName: SUB_VIOLET },
  { act: 2, text: "Not one bloated app.", className: SANS_DIM, speed: 50, hold: 900 },
  { act: 2, text: "A family of sharp, focused tools.", className: "font-sans text-xl font-semibold text-violet-200 sm:text-3xl", speed: 45, hold: 1500, sub: "Faster. Simpler. One account.", subClassName: SUB },

  { act: 2, text: "ApplyHub", className: PRODUCT, speed: 85, hold: 1700, sub: "Recruitment, from first application to final rank.", subClassName: SUB_VIOLET },
  { act: 2, text: "Applicants apply once, and keep one profile.", className: SANS_DIM, speed: 38, hold: 1300 },
  { act: 2, text: "Staff vote with blind quorum, so the fairest answer wins.", className: SANS_DIM, speed: 36, hold: 1400 },
  { act: 2, text: "Approved? Roles and ranks update automatically.", className: SANS_WHITE, speed: 38, hold: 1500, sub: "Candidates hear back by bot or email.", subClassName: SUB },

  { act: 2, text: "Roster", className: PRODUCT, speed: 95, hold: 1700, sub: "Know exactly who your staff are.", subClassName: SUB_VIOLET },
  { act: 2, text: "Department rosters, laid out as a clear tree.", className: SANS_DIM, speed: 38, hold: 1300 },
  { act: 2, text: "Training shifts, scheduled and tracked.", className: SANS_DIM, speed: 38, hold: 1200 },
  { act: 2, text: "One unified staff activity log.", className: SANS_WHITE, speed: 45, hold: 1500, sub: "History that survives when people leave.", subClassName: SUB },

  { act: 2, text: "RankHub", className: PRODUCT, speed: 90, hold: 1700, sub: "High-speed Roblox group ranking.", subClassName: SUB_VIOLET },
  { act: 2, text: "Open Cloud API or secure bot credentials.", className: SANS_DIM, speed: 38, hold: 1300 },
  { act: 2, text: "Dry-run first. See every change before it happens.", className: SANS_WHITE, speed: 38, hold: 1500, sub: "Batch queues. Snapshots. A full audit log.", subClassName: SUB },
  { act: 2, text: "Credentials encrypted. Nothing exported raw.", className: SANS_DIM, speed: 38, hold: 1500 },

  // ───────── Act 3: The promise ─────────
  chapter(3, "ACT III", "The promise"),
  { act: 3, text: "One account.", className: "font-sans text-4xl font-extrabold text-white sm:text-6xl", speed: 70, hold: 1100, sub: "Link Discord or email once. Sign in anywhere.", subClassName: SUB_VIOLET },
  { act: 3, text: "Free forever.", className: "font-sans text-4xl font-extrabold text-white sm:text-6xl", speed: 70, hold: 1200, sub: "No tiers. No per-seat billing. No paywalled features.", subClassName: SUB_VIOLET },
  { act: 3, text: "No trackers. No ad networks.", className: SANS_DIM, speed: 42, hold: 1000 },
  { act: 3, text: "We never sell member data.", className: SANS_DIM, speed: 42, hold: 1200 },
  { act: 3, text: "Export it. Delete it. Your data, your call.", className: SANS_WHITE, speed: 42, hold: 1500 },
  { act: 3, text: "And you decide what we build next.", className: SERIF_SOFT, speed: 50, hold: 1500, sub: "Suggest features. Vote on ideas. Watch them ship.", subClassName: SUB },
  { act: 3, text: "Built by community managers.", className: "font-serif text-2xl italic text-slate-300 sm:text-4xl", speed: 55, hold: 1000 },
  { act: 3, text: "For community managers.", className: "font-serif text-2xl italic text-slate-100 sm:text-4xl", speed: 55, hold: 1700 },

  // ───────── Act 4: The reveal ─────────
  chapter(4, "ACT IV", "The reveal"),
  { act: 4, text: "Introducing", className: "font-mono text-4xl font-bold tracking-[0.18em] text-white sm:text-6xl", speed: 80, hold: 1400 },
  { act: 4, text: "the next", className: "font-serif text-2xl italic text-slate-400 sm:text-3xl", speed: 160, hold: 1000 },
  {
    act: 4,
    text: "RoleFlow v2",
    className:
      "parent-shimmer-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-white bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl",
    speed: 110,
    hold: 2800,
    fx: "flash",
    sub: "Live today.",
    subClassName: "font-mono text-sm uppercase tracking-[0.4em] text-emerald-300 sm:text-base",
  },
  { act: 4, text: "Faster. Simpler. Free forever.", className: "font-sans text-xl font-semibold tracking-wide text-white sm:text-3xl", speed: 45, hold: 1600 },
  { act: 4, text: "One account. Every community tool.", className: "font-sans text-lg font-medium text-violet-300 sm:text-2xl", speed: 40, hold: 1500 },
  { act: 4, text: "ApplyHub  ·  Roster  ·  RankHub", className: "font-mono text-base tracking-[0.3em] text-fuchsia-300 sm:text-xl", speed: 50, hold: 1700 },
  { act: 4, text: "Built with you, for you.", className: "font-serif text-2xl italic text-slate-200 sm:text-4xl", speed: 60, hold: 1500 },
  { act: 4, text: "Ready when you are.", className: "font-serif text-3xl italic text-slate-100 sm:text-5xl", speed: 110, hold: 1800, fx: "glitch" },
];

/** Per-character typing delay after PACE is applied. */
export const charMs = (b: Beat) => b.speed * PACE;
/** Hold time after PACE is applied. */
export const holdMs = (b: Beat) => b.hold * PACE;

/** Total running time, used for the progress bar. */
export const TOTAL_MS = BEATS.reduce((sum, b) => sum + b.text.length * charMs(b) + SETTLE_MS + holdMs(b) + FADE_MS, 0);
