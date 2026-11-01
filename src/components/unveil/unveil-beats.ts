/**
 * The script for the launch intro. Edit the words, pacing, and acts here.
 * UnveilIntro.tsx only knows how to play whatever is in this file.
 *
 * Eight acts: Boot, The problem, The rebuild, then one act each for ApplyHub, Roster and RankHub,
 * Better together (the loop plus the promise), and The reveal. About 3 minutes at the default pace.
 * The longer ten-act script is saved at unveil-beats.full-cut.ts.txt in the project root.
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
  /* 0 */ { name: "Boot", glowA: "rgb(16 185 129)", glowB: "rgb(13 148 136)" },
  /* 1 */ { name: "The problem", glowA: "rgb(100 116 139)", glowB: "rgb(190 60 90)" },
  /* 2 */ { name: "The rebuild", glowA: "rgb(139 92 246)", glowB: "rgb(217 70 239)" },
  /* 3 */ { name: "ApplyHub", glowA: "rgb(124 58 237)", glowB: "rgb(99 102 241)" },
  /* 4 */ { name: "Roster", glowA: "rgb(14 165 233)", glowB: "rgb(99 102 241)" },
  /* 5 */ { name: "RankHub", glowA: "rgb(217 70 239)", glowB: "rgb(244 63 94)" },
  /* 6 */ { name: "Better together", glowA: "rgb(139 92 246)", glowB: "rgb(45 212 191)" },
  /* 7 */ { name: "The reveal", glowA: "rgb(167 139 250)", glowB: "rgb(255 255 255)" },
];

/**
 * One dial for the whole intro. 0.7 is the default. Lower is faster. Applies to typing speed and hold time.
 */
export const PACE = 0.7;

export const FADE_MS = 500;
/** Pause between the last character and the hold timer starting. Matches UnveilIntro. */
export const SETTLE_MS = 200;

// Shared class strings so the script below stays readable.
const SANS_DIM = "font-sans text-lg text-slate-400 sm:text-2xl";
const SANS_WHITE = "font-sans text-xl font-semibold text-white sm:text-3xl";
const SANS_VIOLET = "font-sans text-xl font-semibold text-violet-200 sm:text-3xl";
const SERIF_SOFT = "font-serif text-2xl italic text-slate-300 sm:text-4xl";
const SERIF_BRIGHT = "font-serif text-2xl italic text-slate-100 sm:text-4xl";
const BIG = "font-sans text-4xl font-extrabold text-white sm:text-6xl";
const SUB = "font-sans text-sm text-slate-400 sm:text-lg";
const SUB_VIOLET = "font-sans text-sm text-violet-300 sm:text-lg";
const CHAPTER = "font-mono text-xs uppercase tracking-[0.6em] text-slate-500 sm:text-sm";
const CHAPTER_SUB = "font-sans text-3xl font-extrabold tracking-tight text-white sm:text-5xl";
const PRODUCT = "font-sans text-5xl font-black tracking-tight text-white sm:text-7xl";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

// ───────── Beat builders ─────────
// Lines that carry a subline get a longer default hold so the subline can be read.

/** Title card that opens an act: "ACT III" over a big headline. */
function chapter(act: number, title: string): Beat {
  return { act, kind: "chapter", text: `ACT ${ROMAN[act]}`, className: CHAPTER, sub: title, subClassName: CHAPTER_SUB, speed: 90, hold: 1500 };
}
/** Quiet sans line. */
function dim(act: number, text: string, sub?: string, hold?: number): Beat {
  return { act, text, className: SANS_DIM, speed: 38, hold: hold ?? (sub ? 2000 : 1200), ...(sub ? { sub, subClassName: SUB } : {}) };
}
/** Bright sans line. */
function bold(act: number, text: string, sub?: string, hold?: number): Beat {
  return { act, text, className: SANS_WHITE, speed: 40, hold: hold ?? (sub ? 2200 : 1500), ...(sub ? { sub, subClassName: SUB } : {}) };
}
/** Bright sans line with a violet subline. Used for the key claim of a section. */
function key(act: number, text: string, sub: string, hold = 2300): Beat {
  return { act, text, className: SANS_VIOLET, speed: 40, hold, sub, subClassName: SUB_VIOLET };
}
/** Serif italic statement, the soft voice of the film. */
function soft(act: number, text: string, sub?: string, hold?: number): Beat {
  return { act, text, className: SERIF_SOFT, speed: 55, hold: hold ?? (sub ? 2100 : 1700), ...(sub ? { sub, subClassName: SUB } : {}) };
}
/** Serif italic statement, brighter. */
function bright(act: number, text: string, sub?: string, hold?: number): Beat {
  return { act, text, className: SERIF_BRIGHT, speed: 55, hold: hold ?? (sub ? 2100 : 1800), ...(sub ? { sub, subClassName: SUB } : {}) };
}
/** Big sans headline with a violet subline. */
function big(act: number, text: string, sub: string, hold = 2000): Beat {
  return { act, text, className: BIG, speed: 70, hold, sub, subClassName: SUB_VIOLET };
}
/** Product name, huge. */
function product(act: number, name: string, tagline: string): Beat {
  return { act, text: name, className: PRODUCT, speed: 90, hold: 1900, sub: tagline, subClassName: SUB_VIOLET };
}

export const BEATS: Beat[] = [
  // ───────── Act 0: Boot ─────────
  {
    act: 0,
    kind: "terminal",
    text: [
      "> boot roleflow.core v2.0",
      "> discord gateway ............. ok",
      "> roblox open cloud ........... ok",
      "> loading applyhub ............ ok",
      "> loading roster .............. ok",
      "> loading rankhub ............. ok",
      "> cutover status: READY",
    ].join("\n"),
    className: "",
    speed: 20,
    hold: 1100,
  },

  // ───────── Act 1: The problem ─────────
  chapter(1, "The problem"),
  soft(1, "Every community deserves better tools.", "Because running one is real work.", 1900),
  dim(1, "It starts with a Google Form."),
  dim(1, "Then the Discord DMs pile up."),
  dim(1, "Tickets get lost. Roles get missed.", undefined, 1200),
  bold(1, "That time belongs to your community.", "Not to busywork."),

  // ───────── Act 2: The rebuild ─────────
  chapter(2, "The rebuild"),
  bold(2, "So we rebuilt all of it.", "From the ground up.", 1900),
  soft(2, "What would this look like if the people who use it had built it?", undefined, 2200),
  key(2, "A family of sharp, focused tools.", "Each one does a single job, and does it properly."),
  big(2, "One identity.", "Sign in once. Your profile follows you into every tool."),
  soft(2, "Three products. Let us walk through them.", undefined, 1800),

  // ───────── Act 3: ApplyHub ─────────
  chapter(3, "How people join"),
  product(3, "ApplyHub", "Recruitment, from first application to final rank."),
  bold(3, "Applicants create one verified account.", "Link Roblox and Discord once. Reuse them everywhere."),
  dim(3, "Answers save as they type.", "A closed tab or a new device loses nothing."),
  bold(3, "Staff review from one clean dashboard.", "Kanban board or split view. Whichever suits you."),
  key(3, "Blind voting keeps every opinion honest.", "Votes stay hidden until they are submitted."),
  bright(3, "Prefer Discord? Stay in Discord.", "Quick accept and reject buttons, right in your staff channel.", 2400),
  bold(3, "Moved to interview? A private channel appears.", "Created automatically, named for the applicant."),
  bold(3, "Accepted? Roles and ranks update automatically.", "Candidates hear back by bot or email."),

  // ───────── Act 4: Roster ─────────
  chapter(4, "How your team runs"),
  product(4, "Roster", "Know exactly who your staff are."),
  bold(4, "Connect your Roblox group.", "Verify ownership or rank, preview who will be imported, then confirm."),
  dim(4, "Every staff member gets a record.", "With manager notes that staff never see."),
  bright(4, "Promoting someone? Protected roles ask twice.", "A confirmation step catches mistakes before they happen.", 2400),
  key(4, "One unified staff activity log.", "History that survives when people leave."),
  soft(4, "A team you can actually see.", undefined, 1800),

  // ───────── Act 5: RankHub ─────────
  chapter(5, "How ranks change"),
  product(5, "RankHub", "High-speed Roblox group ranking."),
  bold(5, "Open Cloud API or secure bot credentials.", "You choose how RankHub connects."),
  key(5, "Dry-run first. See every change before it happens.", "Simulate the batch. Then run it for real.", 2500),
  soft(5, "Measure twice. Rank once.", undefined, 1700),
  bold(5, "Snapshots remember your group.", "Capture a baseline before a big night. Restore anyone who needs it.", 2500),
  bright(5, "Something spikes? Anti-nuke steps in.", "Set your thresholds. An instant lockdown can follow a breach.", 2500),
  dim(5, "Every action, written to the audit log.", undefined, 1400),
  soft(5, "Power, with guardrails.", undefined, 1800),

  // ───────── Act 6: Better together (the loop, then the promise) ─────────
  chapter(6, "Better together"),
  soft(6, "Each tool is strong on its own.", undefined, 1300),
  soft(6, "Together, they close the loop.", undefined, 1600),
  bold(6, "Accept in ApplyHub.", undefined, 900),
  bold(6, "Rank in RankHub.", "Automation rules can apply the rank for you.", 1800),
  bold(6, "Onboard in Roster.", undefined, 1300),
  big(6, "One account. Three tools.", "Zero stitching.", 2000),
  big(6, "Free forever.", "No tiers. No per-seat billing. No paywalled features.", 2300),
  dim(6, "No trackers. We never sell member data.", "Export it. Delete it. Your data, your call.", 2200),

  // ───────── Act 7: The reveal ─────────
  chapter(7, "The reveal"),
  soft(7, "And you decide what we build next.", "Suggest features. Vote on ideas. Watch them ship.", 2300),
  bright(7, "This is what we have been building toward.", undefined, 1800),
  { act: 7, text: "Introducing", className: "font-mono text-4xl font-bold tracking-[0.18em] text-white sm:text-6xl", speed: 80, hold: 1400 },
  { act: 7, text: "the next", className: "font-serif text-2xl italic text-slate-400 sm:text-3xl", speed: 160, hold: 1000 },
  {
    act: 7,
    text: "RoleFlow v2",
    className:
      "parent-shimmer-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-white bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl",
    speed: 110,
    hold: 2800,
    fx: "flash",
    sub: "Live today.",
    subClassName: "font-mono text-sm uppercase tracking-[0.4em] text-emerald-300 sm:text-base",
  },
  { act: 7, text: "One account. Every community tool.", className: "font-sans text-lg font-medium text-violet-300 sm:text-2xl", speed: 40, hold: 1500 },
  { act: 7, text: "Ready when you are.", className: "font-serif text-3xl italic text-slate-100 sm:text-5xl", speed: 110, hold: 1800, fx: "glitch" },
];

/** Per-character typing delay after PACE is applied. */
export const charMs = (b: Beat) => b.speed * PACE;
/** Hold time after PACE is applied. */
export const holdMs = (b: Beat) => b.hold * PACE;

/** Total running time, used for the progress bar. */
export const TOTAL_MS = BEATS.reduce((sum, b) => sum + b.text.length * charMs(b) + SETTLE_MS + holdMs(b) + FADE_MS, 0);
