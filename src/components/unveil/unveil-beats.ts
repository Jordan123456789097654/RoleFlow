/**
 * The script for the launch intro. Edit the words, pacing, and acts here.
 * UnveilIntro.tsx only knows how to play whatever is in this file.
 *
 * Ten acts: Boot, The problem, The rebuild, then one act each for ApplyHub, Roster and RankHub,
 * Better together, The promise, Built with you, and The reveal.
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
  /* 7 */ { name: "The promise", glowA: "rgb(129 140 248)", glowB: "rgb(232 121 249)" },
  /* 8 */ { name: "Built with you", glowA: "rgb(52 211 153)", glowB: "rgb(139 92 246)" },
  /* 9 */ { name: "The reveal", glowA: "rgb(167 139 250)", glowB: "rgb(255 255 255)" },
];

/**
 * One dial for the whole intro. At 1 the script runs about 7m25s.
 * 0.7 (default) is about 5m35s. 0.5 is about 4m25s. Applies to typing speed and hold time.
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
  chapter(1, "The problem"),
  soft(1, "Every community deserves better tools.", "Because running one is real work.", 1900),
  soft(1, "Behind every great server is someone doing the unglamorous work.", "Reading applications at midnight.", 2100),
  dim(1, "It starts with a Google Form."),
  dim(1, "Then the Discord DMs pile up."),
  dim(1, "Tickets get lost. Roles get missed.", undefined, 1200),
  dim(1, "Someone re-checks every Roblox profile by hand.", undefined, 1300),
  dim(1, "Hundreds of hours of applications.", undefined, 1000),
  dim(1, "Hundreds of hours of rank changes.", undefined, 1000),
  dim(1, "Hundreds of hours of staff shifts.", undefined, 1200),
  soft(1, "Hours that could have gone to the people you are building for."),
  { act: 1, text: "All of it stitched together with spreadsheets, bot commands, and hope.", className: "font-sans text-lg text-slate-300 sm:text-2xl", speed: 36, hold: 1800 },
  bold(1, "That time belongs to your community.", "Not to busywork."),

  // ───────── Act 2: The rebuild ─────────
  chapter(2, "The rebuild"),
  bold(2, "So we rebuilt all of it.", "From the ground up.", 1900),
  bright(2, "Software should get out of your way."),
  dim(2, "We started with one question.", undefined, 1100),
  soft(2, "What would this look like if the people who use it had built it?", undefined, 2200),
  dim(2, "So we listened to community managers.", undefined, 1100),
  dim(2, "What slows you down?", undefined, 1000),
  dim(2, "What do you re-type, re-check, and re-do?", undefined, 1200),
  dim(2, "What do you wish just happened on its own?", undefined, 1300),
  soft(2, "Their answers became the blueprint.", undefined, 1800),
  soft(2, "Not one bloated app."),
  key(2, "A family of sharp, focused tools.", "Each one does a single job, and does it properly."),
  dim(2, "Each tool gets its own home.", "Its own focus. Its own pace of improvement.", 2000),
  dim(2, "But they are built to work together.", undefined, 1300),
  big(2, "One identity.", "Sign in once. Your profile follows you into every tool."),
  dim(2, "Fewer tabs. Fewer clicks.", undefined, 1100),
  dim(2, "Fewer things to remember.", undefined, 1100),
  bright(2, "Everything you used to stitch together by hand.", "Now it simply works together.", 2300),
  soft(2, "Three products. Let us walk through them.", undefined, 2000),

  // ───────── Act 3: ApplyHub ─────────
  chapter(3, "How people join"),
  product(3, "ApplyHub", "Recruitment, from first application to final rank."),
  soft(3, "Let us start with how people join."),
  bold(3, "Applicants create one verified account.", "Link Roblox and Discord once. Reuse them everywhere."),
  dim(3, "Answers save as they type.", "A closed tab or a new device loses nothing."),
  dim(3, "Every application has a clear path.", "Pending. Under review. Interview. Decision."),
  dim(3, "Applicants can follow along, and talk to the team.", "My Applications keeps every one in a single place."),
  soft(3, "Now, the other side of the table.", undefined, 1800),
  bold(3, "Staff review from one clean dashboard.", "Kanban board or split view. Whichever suits you."),
  key(3, "Blind voting keeps every opinion honest.", "Votes stay hidden until they are submitted."),
  dim(3, "Star ratings. Saved replies. Reviewer workload at a glance.", undefined, 1500),
  dim(3, "Rejection cooldowns and a community blacklist.", "Spam stops at the door."),
  bright(3, "Prefer Discord? Stay in Discord.", "Quick accept and reject buttons, right in your staff channel.", 2400),
  dim(3, "Slash commands for the rest.", "/setup  ·  /openings  ·  /apply  ·  /status", 2200),
  bold(3, "Moved to interview? A private channel appears.", "Created automatically, named for the applicant."),
  bold(3, "Accepted? Roles and ranks update automatically.", "Candidates hear back by bot or email."),
  key(3, "Run it under your own bot.", "Your name. Your avatar. Your community, your brand."),
  soft(3, "From first application to final rank.", undefined, 1500),
  soft(3, "Without the chaos.", undefined, 2000),

  // ───────── Act 4: Roster ─────────
  chapter(4, "How your team runs"),
  product(4, "Roster", "Know exactly who your staff are."),
  soft(4, "Then, how your team stays organized."),
  bold(4, "Connect your Roblox group.", "Verify ownership or rank, preview who will be imported, then confirm."),
  dim(4, "Departments become teams.", "Department rosters, laid out as a clear tree."),
  dim(4, "Every staff member gets a record.", "With manager notes that staff never see."),
  dim(4, "Permissions that match your hierarchy.", "Moderators view and log. Managers run the roster.", 2200),
  bold(4, "Training sessions, scheduled and tracked.", "Checklists for every new hire."),
  dim(4, "Shifts, scheduled and completed, all on the record.", undefined, 1500),
  bright(4, "Promoting someone? Protected roles ask twice.", "A confirmation step catches mistakes before they happen.", 2400),
  dim(4, "Announcements to the whole group.", "Schedule updates. Policy reminders. One place."),
  key(4, "One unified staff activity log.", "History that survives when people leave."),
  soft(4, "A team you can actually see.", undefined, 2000),

  // ───────── Act 5: RankHub ─────────
  chapter(5, "How ranks change"),
  product(5, "RankHub", "High-speed Roblox group ranking."),
  soft(5, "And finally, how ranks actually change."),
  bold(5, "Open Cloud API or secure bot credentials.", "You choose how RankHub connects."),
  dim(5, "Your whole rank ladder, searchable.", "Filter by name or rank number."),
  dim(5, "Change many ranks in one batch.", undefined, 1300),
  key(5, "Dry-run first. See every change before it happens.", "Simulate the batch. Then run it for real.", 2500),
  soft(5, "Measure twice. Rank once.", undefined, 1900),
  bold(5, "Snapshots remember your group.", "Capture a baseline before a big night. Restore anyone who needs it.", 2500),
  dim(5, "A safety ceiling checks every change.", undefined, 1400),
  bright(5, "Something spikes? Anti-nuke steps in.", "Set your thresholds. An instant lockdown can follow a breach.", 2500),
  dim(5, "Test the emergency lockdown before you ever need it.", undefined, 1500),
  bold(5, "Credentials encrypted. Nothing exported raw.", "AES-256-GCM encryption."),
  dim(5, "Every action, written to the audit log.", undefined, 1400),
  soft(5, "Power, with guardrails.", undefined, 2000),

  // ───────── Act 6: Better together ─────────
  chapter(6, "Better together"),
  soft(6, "Each tool is strong on its own.", undefined, 1500),
  soft(6, "Together, they close the loop.", undefined, 1800),
  bold(6, "Accept in ApplyHub.", undefined, 900),
  bold(6, "Rank in RankHub.", "Automation rules can apply the rank for you.", 1800),
  bold(6, "Onboard in Roster.", undefined, 1300),
  dim(6, "No copy and paste.", undefined, 1000),
  dim(6, "No spreadsheet in between.", undefined, 1200),
  big(6, "One account. Three tools.", "Zero stitching.", 2200),

  // ───────── Act 7: The promise ─────────
  chapter(7, "The promise"),
  bright(7, "Tools should earn your trust.", "So we kept the promises simple.", 2200),
  big(7, "Free forever.", "No tiers. No per-seat billing. No paywalled features.", 2300),
  soft(7, "Nothing locked away behind a paywall.", undefined, 1700),
  dim(7, "No trackers. No ad networks.", undefined, 1000),
  dim(7, "We never sell member data.", undefined, 1200),
  bold(7, "Export it. Delete it. Your data, your call.", undefined, 1600),
  soft(7, "Essential cookies only.", undefined, 1500),

  // ───────── Act 8: Built with you ─────────
  chapter(8, "Built with you"),
  soft(8, "And you decide what we build next.", "Suggest features. Vote on ideas. Watch them ship.", 2300),
  soft(8, "Your community. Your rules.", undefined, 1600),
  soft(8, "Built by community managers.", undefined, 1000),
  bright(8, "For community managers.", undefined, 1800),

  // ───────── Act 9: The reveal ─────────
  chapter(9, "The reveal"),
  bright(9, "This is what we have been building toward.", undefined, 1900),
  { act: 9, text: "Introducing", className: "font-mono text-4xl font-bold tracking-[0.18em] text-white sm:text-6xl", speed: 80, hold: 1400 },
  { act: 9, text: "the next", className: "font-serif text-2xl italic text-slate-400 sm:text-3xl", speed: 160, hold: 1000 },
  {
    act: 9,
    text: "RoleFlow v2",
    className:
      "parent-shimmer-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-white bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl",
    speed: 110,
    hold: 2800,
    fx: "flash",
    sub: "Live today.",
    subClassName: "font-mono text-sm uppercase tracking-[0.4em] text-emerald-300 sm:text-base",
  },
  bright(9, "Thank you to every community that helped shape this.", undefined, 2000),
  { act: 9, text: "Faster. Simpler. Free forever.", className: "font-sans text-xl font-semibold tracking-wide text-white sm:text-3xl", speed: 45, hold: 1600 },
  { act: 9, text: "One account. Every community tool.", className: "font-sans text-lg font-medium text-violet-300 sm:text-2xl", speed: 40, hold: 1500 },
  { act: 9, text: "ApplyHub  ·  Roster  ·  RankHub", className: "font-mono text-base tracking-[0.3em] text-fuchsia-300 sm:text-xl", speed: 50, hold: 1700 },
  soft(9, "Built with you, for you.", undefined, 1500),
  { act: 9, text: "Ready when you are.", className: "font-serif text-3xl italic text-slate-100 sm:text-5xl", speed: 110, hold: 1800, fx: "glitch" },
];

/** Per-character typing delay after PACE is applied. */
export const charMs = (b: Beat) => b.speed * PACE;
/** Hold time after PACE is applied. */
export const holdMs = (b: Beat) => b.hold * PACE;

/** Total running time, used for the progress bar. */
export const TOTAL_MS = BEATS.reduce((sum, b) => sum + b.text.length * charMs(b) + SETTLE_MS + holdMs(b) + FADE_MS, 0);
