/**
 * Premade bulk-email templates. Pure functions with no server imports, so the founder console can
 * preview them in the browser and the server re-renders the exact same HTML when sending.
 * Every value is HTML-escaped; links must be https.
 */

export const DEFAULT_ORIGIN = "https://roleflow.site";

export const CATEGORIES = [
  "Announcements",
  "Product",
  "Growth",
  "Community",
  "Staffing",
  "Operations",
  "Security",
  "Support",
  "Legal",
  "Seasonal",
  "Staff",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type FieldDef = {
  key: string;
  label: string;
  help?: string;
  multiline?: boolean;
  required?: boolean;
  url?: boolean;
  maxLength: number;
  default: string;
};

export type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

export type Built = {
  subject: string;
  preheader?: string;
  heading: string;
  paragraphs: string[];
  sections?: Section[];
  bullets?: string[];
  cta?: { label: string; url: string };
  footnote?: string;
};

/** "all" goes to every eligible address. "staff" goes only to verified company addresses of staff members. */
export type Audience = "all" | "staff";

export type Template = {
  id: string;
  name: string;
  category: Category;
  audience?: Audience;
  description: string;
  fields: FieldDef[];
  build: (v: Record<string, string>) => Built;
};

export type RenderedEmail = { subject: string; html: string; text: string };

// ---------- field helpers ----------

const text = (key: string, label: string, def = "", o: Partial<FieldDef> = {}): FieldDef => ({
  key, label, default: def, maxLength: 160, ...o,
});
const body = (def: string, label = "Opening message"): FieldDef => ({
  key: "body", label, default: def, multiline: true, required: true, maxLength: 4000,
  help: "The first thing people read. Separate paragraphs with a blank line.",
});
const bullets = (def: string, label = "Bullet points"): FieldDef => ({
  key: "bullets", label, default: def, multiline: true, maxLength: 2000,
  help: "One item per line. Leave empty to skip.",
});
const note = (def: string, label = "Closing note"): FieldDef => ({
  key: "note", label, default: def, multiline: true, maxLength: 2000,
  help: "Shown at the end of the email, before the button. Leave empty to skip.",
});
const ctaFields = (label: string, url: string): FieldDef[] => [
  text("ctaLabel", "Button text", label, { maxLength: 40 }),
  text("ctaUrl", "Button link (https)", url, { url: true, maxLength: 300 }),
];

const splitParas = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const splitLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const optional = (s: string | undefined) => (s ?? "").trim();

// ---------- templates ----------

const T: Template[] = [
  // ===== Announcements =====
  {
    id: "product-launch",
    name: "Product launch",
    category: "Announcements",
    description: "Announce something new that is ready to use today, with what it does and how to start.",
    fields: [
      text("title", "Headline", "Something new is here", { required: true }),
      body("We have launched a new way to run hiring for your community. It is ready for you to try today, and it works with everything you already have set up."),
      bullets("Faster application review with keyboard shortcuts\nBulk actions across many applications\nClearer status history for every applicant"),
      note("There is nothing to install. Open RoleFlow and the new options appear in your dashboard."),
      ...ctaFields("See what's new", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: v.title,
      preheader: "Now available in RoleFlow",
      heading: v.title,
      paragraphs: splitParas(v.body),
      sections: [{ title: "What is included", bullets: splitLines(v.bullets) }],
      footnote: v.note,
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "monthly-newsletter",
    name: "Monthly newsletter",
    category: "Announcements",
    description: "A regular roundup of news, tips, and what is coming next.",
    fields: [
      text("month", "Month", "This month", { required: true }),
      body("Thanks for being part of RoleFlow. Here is a short look at what happened this month and what is planned next."),
      bullets("New guide: writing interview questions that reveal skill\nCommunity spotlight of the month\nScheduled maintenance window next Sunday"),
      text("featureTitle", "Featured story headline", "Community spotlight"),
      { ...body("A community used structured questions to cut review time in half. Their approach is simple, and it can work for yours too.", "Featured story text"), key: "featureBody", required: false },
      ...ctaFields("Read the newsletter online", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `RoleFlow newsletter: ${v.month}`,
      preheader: `This month at RoleFlow`,
      heading: `${v.month} at RoleFlow`,
      paragraphs: splitParas(v.body),
      sections: [
        { title: "This month", bullets: splitLines(v.bullets) },
        { title: v.featureTitle, paragraphs: splitParas(v.featureBody) },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "quarterly-roadmap",
    name: "Quarterly roadmap",
    category: "Announcements",
    description: "Share what is planned for the next three months, and ask for input.",
    fields: [
      text("quarter", "Quarter", "Q1 next year", { required: true }),
      body("Here is what we plan to work on next quarter. These plans can change, and your feedback decides what moves up the list."),
      bullets("Analytics for applicant funnels\nFaster mobile dashboards\nMore template options for position questions"),
      text("feedbackTitle", "Feedback heading", "Tell us what matters most"),
      ...ctaFields("Vote on priorities", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Our plans for ${v.quarter}`,
      heading: `Roadmap: ${v.quarter}`,
      paragraphs: splitParas(v.body),
      sections: [
        { title: "Planned", bullets: splitLines(v.bullets) },
        { title: v.feedbackTitle, paragraphs: ["Reply to this email or use the feedback form. We read every response."] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "pricing-change",
    name: "Pricing change",
    category: "Announcements",
    description: "Explain an upcoming price or plan change, with the date it takes effect and what it means for each plan.",
    fields: [
      text("effective", "Takes effect on", "next month", { required: true }),
      body("We are updating our plans so we can keep investing in reliability and new features. This change does not affect anything you have already built on RoleFlow."),
      text("current", "Current price summary", "Current plans stay the same until the date above"),
      text("reason", "Why we are changing it", "Higher hosting costs and more features on each plan"),
      ...ctaFields("View plans", `${DEFAULT_ORIGIN}/billing`),
    ],
    build: (v) => ({
      subject: `Pricing update, effective ${v.effective}`,
      preheader: "What changes and when",
      heading: "An update to our pricing",
      paragraphs: splitParas(v.body),
      sections: [
        { title: "When it takes effect", paragraphs: [`The change takes effect on ${v.effective}.`] },
        { title: "Why we are changing it", paragraphs: [v.reason] },
        { title: "What stays the same", paragraphs: [v.current, "Your data, communities, and applications are not affected."] },
        { title: "Questions", paragraphs: ["Reply to this email or contact support, and we will answer within two business days."] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "new-plan-available",
    name: "New plan available",
    category: "Announcements",
    description: "Introduce a new plan tier and compare it with the current options.",
    fields: [
      text("plan", "Plan name", "RoleFlow Pro", { required: true }),
      body("We have added a new plan for communities that run several hiring programs at once. It keeps everything in the current plans and adds more capacity and reporting."),
      bullets("More communities per account\nAdvanced analytics and exports\nPriority support response times"),
      ...ctaFields("Compare plans", `${DEFAULT_ORIGIN}/billing`),
    ],
    build: (v) => ({
      subject: `Introducing ${v.plan}`,
      heading: `Introducing ${v.plan}`,
      paragraphs: splitParas(v.body),
      sections: [{ title: `What you get with ${v.plan}`, bullets: splitLines(v.bullets) }, ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "year-in-review",
    name: "Year in review",
    category: "Announcements",
    description: "Share the year's numbers and milestones with the people who made them happen.",
    fields: [
      text("year", "Year", "this year", { required: true }),
      body("This year RoleFlow grew alongside the communities that use it. Thank you for the feedback, the bug reports, and the patience while we built."),
      bullets("Communities using RoleFlow grew significantly\nNew hiring tools shipped every month\nResponse times improved across support"),
      text("highlight", "One highlight to celebrate", "Our most requested feature shipped"),
      ...ctaFields("Read the full review", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `RoleFlow in ${v.year}: a review`,
      heading: `${v.year} in review`,
      paragraphs: splitParas(v.body),
      sections: [{ title: "The year in brief", bullets: splitLines(v.bullets) }, { title: "A highlight", paragraphs: [v.highlight] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Product =====
  {
    id: "feature-update",
    name: "Feature update",
    category: "Product",
    description: "Tell people what changed in a feature, why, and what they need to do (if anything).",
    fields: [
      text("feature", "Feature name", "Application reviews", { required: true }),
      body("We rebuilt how application reviews work so you can score applicants faster and keep notes in one place. Your existing reviews and history are unchanged."),
      text("whatChanged", "Main change", "Scores now save as you type, and reviewers see each other's notes"),
      bullets("Scores save automatically\nReviewer notes sit next to each answer\nFilters remember your last choice"),
      note("No action is needed. The new version is already live for everyone."),
      ...ctaFields("Try it out", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Update: ${v.feature} is better`,
      heading: `${v.feature} got an upgrade`,
      paragraphs: splitParas(v.body),
      sections: [{ title: "What changed", paragraphs: [v.whatChanged] }, { title: "Details", bullets: splitLines(v.bullets) }],
      footnote: v.note,
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "changelog-highlights",
    name: "Changelog highlights",
    category: "Product",
    description: "A list of what shipped recently, grouped so people can scan it quickly.",
    fields: [
      text("version", "Version or month", "This month", { required: true }),
      body("Here is what we shipped recently. Each item links to the full changelog if you want the details."),
      bullets("Faster dashboard loading\nNew bulk actions for applications\nBetter mobile layout\nFixed a bug that hid some application tags"),
      { ...bullets("Custom report exports\nScheduled reminders for applicants", "Coming next"), key: "bullets2" },
      ...ctaFields("Read the full changelog", `${DEFAULT_ORIGIN}/changelog`),
    ],
    build: (v) => ({
      subject: `What's new: ${v.version}`,
      heading: `What's new in ${v.version}`,
      paragraphs: splitParas(v.body),
      sections: [{ title: "Shipped", bullets: splitLines(v.bullets) }, { title: "Coming next", bullets: splitLines(v.bullets2 ?? "") }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "tips-how-to",
    name: "Tips and how-to",
    category: "Product",
    description: "A practical guide to one task, with steps people can follow.",
    fields: [
      text("topic", "Topic", "Writing applications people finish", { required: true }),
      body("Good applications start with good questions. Here are a few changes that make a noticeable difference to how many people finish applying."),
      bullets("Keep each question short and specific\nAsk for examples instead of opinions\nSet a clear deadline on every position\nTell applicants what happens after they submit"),
      text("stepsTitle", "Steps heading", "Try this today"),
      ...ctaFields("Read the guide", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: `Tip: ${v.topic}`,
      heading: v.topic,
      paragraphs: splitParas(v.body),
      sections: [{ title: v.stepsTitle, bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "new-integration",
    name: "New integration",
    category: "Product",
    description: "Announce a new connection with another tool, and how to set it up.",
    fields: [
      text("integration", "Integration name", "Discord role sync", { required: true }),
      body("You can now connect RoleFlow to another tool so the two stay in step without copying information by hand."),
      bullets("Set it up from the settings page in a few minutes\nChanges sync automatically in both directions\nYou choose which fields are shared"),
      text("requirement", "What is needed to use it", "An administrator account in the community"),
      ...ctaFields("Set it up", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: `Connect RoleFlow with ${v.integration}`,
      heading: `${v.integration} is here`,
      paragraphs: splitParas(v.body),
      sections: [{ title: "How it works", bullets: splitLines(v.bullets) }, { title: "What you need", paragraphs: [v.requirement] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "deprecation-notice",
    name: "Feature being retired",
    category: "Product",
    description: "Give notice that a feature is going away, with a date and a replacement.",
    fields: [
      text("feature", "Feature being retired", "The legacy import tool", { required: true }),
      text("date", "Retirement date", "in 60 days", { required: true }),
      body("We are retiring a feature so we can focus on the tools used most. It will keep working until the date above. After that it will no longer be available."),
      text("replacement", "Replacement", "Use the new import wizard in the position editor"),
      ...ctaFields("See the replacement", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: `${v.feature} will be retired ${v.date}`,
      heading: `Retiring ${v.feature}`,
      paragraphs: splitParas(v.body),
      sections: [
        { title: "Key dates", bullets: [`Retirement date: ${v.date}`] },
        { title: "What to use instead", paragraphs: [v.replacement] },
        { title: "Need help moving?", paragraphs: ["Reply to this email and we will walk you through the change."] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "bug-fix-notice",
    name: "Bug fix notice",
    category: "Product",
    description: "Tell people a reported bug is fixed, and what they should check.",
    fields: [
      text("bug", "What was broken", "Some applicant tags did not save", { required: true }),
      body("Thank you to everyone who reported this. The problem is fixed, and we have added checks so it does not come back."),
      text("check", "What to check", "Re-save any tags you set between the dates above"),
      text("fixedOn", "Fixed on", "today"),
      ...ctaFields("Report a new issue", `${DEFAULT_ORIGIN}/feedback`),
    ],
    build: (v) => ({
      subject: `Fixed: ${v.bug}`,
      heading: "A bug is fixed",
      paragraphs: splitParas(v.body),
      sections: [{ title: "What was broken", paragraphs: [v.bug] }, { title: "Fixed", paragraphs: [`Fixed ${v.fixedOn}.`] }, { title: "What to check", paragraphs: [v.check] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "applicant-experience-guide",
    name: "Applicant experience guide",
    category: "Product",
    description: "Help communities give applicants a clear, respectful experience from submission to decision.",
    fields: [
      body("Applicants remember how the process made them feel, even when the answer is no. This guide covers the small steps that make the biggest difference."),
      bullets("Acknowledge every submission within a day\nTell applicants the expected decision date\nWrite decision notes as if the applicant will read them, because they will\nClose positions when they are filled"),
      ...ctaFields("Read the full guide", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: "A guide to a better applicant experience",
      heading: "Make applicants feel respected",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Five habits that help", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Growth =====
  {
    id: "beta-invite",
    name: "Beta invitation",
    category: "Growth",
    description: "Invite people to try an early feature, with what to expect and how to give feedback.",
    fields: [
      text("feature", "Beta feature", "the new community site builder", { required: true }),
      body("You are invited to try {FEATURE} before everyone else. Your feedback will shape the final version, so we would really value your honest opinion, including what you do not like."),
      bullets("Early access starts today\nIt may change or break in small ways\nYou can leave at any time from the same page"),
      text("time", "How long it takes", "about 10 minutes"),
      ...ctaFields("Join the beta", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "You're invited to the RoleFlow beta",
      preheader: `Early access to ${v.feature}`,
      heading: "You're invited to the beta",
      paragraphs: splitParas(v.body.split("{FEATURE}").join(v.feature)),
      sections: [{ title: "What to expect", bullets: splitLines(v.bullets) }, { title: "Time needed", paragraphs: [`Trying it out takes ${v.time}.`] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "feedback-survey",
    name: "Feedback survey",
    category: "Growth",
    description: "Ask for a few minutes of feedback, with what you will do with the answers.",
    fields: [
      body("We are working on the next version of RoleFlow and would love your opinion. Your answers decide what we build first."),
      text("time", "Time it takes", "about three minutes", { required: true }),
      bullets("How easy is it to finish an application?\nWhat would save you the most time?\nWhat should we stop doing?"),
      text("promise", "What we promise", "Every answer is read, and we will share a summary next month"),
      ...ctaFields("Take the survey", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "Got a few minutes for us?",
      heading: "Help us build the next RoleFlow",
      paragraphs: splitParas(v.body),
      sections: [
        { title: "Questions we will ask", bullets: splitLines(v.bullets) },
        { title: "How long it takes", paragraphs: [`The survey takes ${v.time}.`] },
        { title: "Our promise", paragraphs: [v.promise] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "referral-ask",
    name: "Referral request",
    category: "Growth",
    description: "Ask happy users to tell another community about RoleFlow, without pressure.",
    fields: [
      body("If RoleFlow has made hiring easier for your community, would you tell another community about it? There is no reward, and we only want to help people who need it."),
      bullets("Share this link with a friend who runs a community\nTell us which features helped the most\nReply to this email if you want help explaining it"),
      ...ctaFields("Share RoleFlow", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "Know another community that could use RoleFlow?",
      heading: "Share what is working",
      paragraphs: splitParas(v.body),
      sections: [{ title: "How you can help", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "plan-offer",
    name: "Limited-time offer",
    category: "Growth",
    description: "Promote a discount or upgrade with a clear deadline and the terms spelled out.",
    fields: [
      text("offer", "Offer", "30% off Pro for one year", { required: true }),
      text("deadline", "Deadline", "Sunday at midnight ET", { required: true }),
      body("For a short time you can upgrade to Pro at a discount. Pro adds more communities, custom domains, and advanced analytics, and it is ready the moment you upgrade."),
      bullets("Discount applies to the first year\nCancel any time from billing\nExisting Pro accounts get the discount on renewal"),
      text("terms", "Terms", "One offer per account. The discount does not stack with other promotions."),
      ...ctaFields("Claim the offer", `${DEFAULT_ORIGIN}/billing`),
    ],
    build: (v) => ({
      subject: `${v.offer}, ends ${v.deadline}`,
      heading: v.offer,
      paragraphs: splitParas(v.body),
      sections: [
        { title: "How it works", bullets: splitLines(v.bullets) },
        { title: "Deadline", paragraphs: [`The offer ends ${v.deadline}.`] },
        { title: "Terms", paragraphs: [v.terms] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "trial-ending",
    name: "Trial ending",
    category: "Growth",
    description: "Warn people their trial is ending, what happens next, and how to keep going.",
    fields: [
      text("days", "Days left in the trial", "3", { required: true }),
      body("Your RoleFlow trial ends in a few days. Nothing is deleted when it ends, but some features will switch off until you choose a plan."),
      bullets("Your communities and applications stay saved\nFree features keep working\nPro features pause until you upgrade"),
      ...ctaFields("Choose a plan", `${DEFAULT_ORIGIN}/billing`),
    ],
    build: (v) => ({
      subject: `Your RoleFlow trial ends in ${v.days} days`,
      heading: "Your trial is ending soon",
      paragraphs: splitParas(v.body),
      sections: [{ title: "What happens next", bullets: splitLines(v.bullets) }, { title: "Time left", paragraphs: [`${v.days} days remain.`] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "onboarding-reminder",
    name: "Finish your setup",
    category: "Growth",
    description: "Nudge people who started but did not finish setting up, with the next step.",
    fields: [
      body("You started setting up RoleFlow but have not finished yet. It only takes a few minutes to publish your first position, and then applicants can start applying."),
      bullets("Name your community and add a logo\nCreate your first position with a few questions\nPublish it and share the link"),
      ...ctaFields("Finish setup", `${DEFAULT_ORIGIN}/dashboard`),
    ],
    build: (v) => ({
      subject: "Almost there, finish your RoleFlow setup",
      heading: "Pick up where you left off",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Three quick steps", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "reactivation",
    name: "We miss you",
    category: "Growth",
    description: "Win back people who have not been around for a while, and show what changed.",
    fields: [
      body("It has been a while since we last saw you on RoleFlow. A lot has changed, and we would love to show you what is new and what we fixed because of feedback like yours."),
      bullets("Faster applications and reviews\nBetter reporting for community leaders\nA cleaner, simpler dashboard"),
      ...ctaFields("Come back", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "We miss you on RoleFlow",
      heading: "Good to see you again",
      paragraphs: splitParas(v.body),
      sections: [{ title: "What is new", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "case-study-invite",
    name: "Case study invitation",
    category: "Growth",
    description: "Ask a community to share how they use RoleFlow, with the terms and what they get.",
    fields: [
      text("community", "Community name", "Your community", { required: true }),
      body("We would love to feature how {COMMUNITY} runs its hiring. A short write-up helps other communities learn from what you have built."),
      bullets("A 20 minute call, or written answers if you prefer\nYou review the final text before anything is published\nYou can ask us to remove your name at any time"),
      ...ctaFields("Tell us about it", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Would ${v.community} share its story?`,
      heading: "Share your story",
      paragraphs: splitParas(v.body.split("{COMMUNITY}").join(v.community)),
      sections: [{ title: "What it involves", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Community =====
  {
    id: "community-spotlight",
    name: "Community spotlight",
    category: "Community",
    description: "Feature a community that is doing great work, and say why it matters.",
    fields: [
      text("community", "Community name", "Your community", { required: true }),
      body("We wanted to highlight {COMMUNITY}, which has been doing excellent work with RoleFlow. Thank you for setting the standard for everyone else."),
      text("why", "Why they stand out", "Clear questions, fast decisions, and kind feedback to every applicant"),
      ...ctaFields("Visit the community", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Spotlight: ${v.community}`,
      heading: `Spotlight on ${v.community}`,
      paragraphs: splitParas(v.body.split("{COMMUNITY}").join(v.community)),
      sections: [{ title: "What stands out", paragraphs: [v.why] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "community-milestone",
    name: "Milestone thank-you",
    category: "Community",
    description: "Celebrate a platform milestone and thank the people who got there.",
    fields: [
      text("milestone", "Milestone", "10,000 applications reviewed", { required: true }),
      body("We hit a milestone together: {MILESTONE}. Each of those numbers is a person who was seen, considered, and treated with care."),
      text("thanks", "Who we are thanking", "every community admin, reviewer, and applicant"),
      ...ctaFields("Read more", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `We did it: ${v.milestone}`,
      heading: "A milestone worth celebrating",
      paragraphs: splitParas(v.body.split("{MILESTONE}").join(v.milestone)),
      sections: [{ title: "Thank you to", paragraphs: [v.thanks] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "event-invite",
    name: "Event invitation",
    category: "Community",
    description: "Invite people to a live event or webinar, with the agenda and how to join.",
    fields: [
      text("event", "Event name", "RoleFlow community office hours", { required: true }),
      text("when", "Date and time", "Thursday at 7 PM ET", { required: true }),
      body("Join us for {EVENT} on {WHEN}. Bring your questions. We will cover new features and answer what you ask live."),
      bullets("A short demo of what is new\nOpen questions from the community\nA look at what is coming next"),
      text("length", "Length", "45 minutes"),
      ...ctaFields("Save my spot", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Join us: ${v.event}`,
      heading: v.event,
      paragraphs: splitParas(v.body.split("{EVENT}").join(v.event).split("{WHEN}").join(v.when)),
      sections: [{ title: "Agenda", bullets: splitLines(v.bullets) }, { title: "Details", bullets: [`When: ${v.when}`, `Length: ${v.length}`] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "community-guidelines-reminder",
    name: "Community guidelines reminder",
    category: "Community",
    description: "Remind everyone how to treat applicants and each other, with the key rules in short form.",
    fields: [
      body("Our community guidelines describe how everyone on RoleFlow should behave. A few reminders are worth repeating, especially as more communities join."),
      bullets("Treat every applicant with respect, even when the answer is no\nDo not share application details outside the review team\nReport abuse instead of responding to it"),
      ...ctaFields("Read the guidelines", `${DEFAULT_ORIGIN}/community-guidelines`),
    ],
    build: (v) => ({
      subject: "A reminder about community guidelines",
      heading: "Keeping RoleFlow respectful",
      paragraphs: splitParas(v.body),
      sections: [{ title: "The short version", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "thank-you",
    name: "Thank you",
    category: "Community",
    description: "A plain, personal thank-you that does not ask for anything.",
    fields: [
      body("Thank you for being part of RoleFlow. Your feedback, patience, and bug reports help us build something better every week."),
      ...ctaFields("Open RoleFlow", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "Thank you",
      heading: "Thank you",
      paragraphs: splitParas(v.body),
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Operations =====
  {
    id: "maintenance-window",
    name: "Scheduled maintenance",
    category: "Operations",
    description: "Warn people about planned downtime, what is affected, and what to do before it starts.",
    fields: [
      text("window", "Window (with time zone)", "Sunday 2 AM to 3 AM ET", { required: true }),
      body("We will perform planned maintenance during the window above to improve reliability. The site may be briefly unavailable. Your data is safe."),
      bullets("Saving drafts still works in the browser\nApplications can be submitted again after the window\nDiscord bot commands may pause briefly"),
      text("before", "Before it starts", "Finish any reviews you are in the middle of"),
      ...ctaFields("Status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Scheduled maintenance: ${v.window}`,
      heading: "Planned maintenance",
      paragraphs: splitParas(v.body),
      sections: [
        { title: "When", paragraphs: [v.window] },
        { title: "What may be affected", bullets: splitLines(v.bullets) },
        { title: "What to do before it starts", paragraphs: [v.before] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "unplanned-outage",
    name: "Unplanned outage notice",
    category: "Operations",
    description: "Tell people about an outage while it is happening, what we know, and when the next update comes.",
    fields: [
      text("started", "When it started", "at 10:40 AM ET", { required: true }),
      body("We are aware of an outage that is affecting part of RoleFlow. Our team is working on it now. We will post updates on the status page until it is resolved."),
      bullets("Sign-in may fail for some people\nApplication pages may load slowly\nYour data has not been lost"),
      text("nextUpdate", "Next update", "within 60 minutes"),
      ...ctaFields("View status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "We are working on an outage",
      heading: "We are aware of an outage",
      paragraphs: splitParas(v.body),
      sections: [
        { title: "Started", paragraphs: [v.started] },
        { title: "What people may notice", bullets: splitLines(v.bullets) },
        { title: "Next update", paragraphs: [v.nextUpdate] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "incident-resolved",
    name: "Incident resolved",
    category: "Operations",
    description: "Apologise, explain what happened in plain language, and say what is being done to prevent a repeat.",
    fields: [
      text("duration", "How long it lasted", "about 40 minutes", { required: true }),
      body("Between earlier today and now, parts of RoleFlow were unavailable for {DURATION}. The issue is resolved. We are sorry for the disruption, and we know how much you rely on the platform."),
      text("cause", "What caused it, in plain language", "A configuration change that overloaded one service"),
      text("prevent", "What we are doing to prevent a repeat", "Adding checks that catch this before it reaches production"),
      ...ctaFields("View status", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "Resolved: service disruption",
      heading: "The issue is resolved",
      paragraphs: splitParas(v.body.split("{DURATION}").join(v.duration)),
      sections: [
        { title: "What happened", paragraphs: [v.cause] },
        { title: "What we are doing", paragraphs: [v.prevent] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "migration-notice",
    name: "Platform migration notice",
    category: "Operations",
    description: "Warn people about a move to new infrastructure, what changes for them, and what they must do.",
    fields: [
      text("date", "Migration date", "next Saturday", { required: true }),
      body("We are moving RoleFlow to newer infrastructure so it is faster and more reliable. For most people, nothing changes. A short period of downtime is planned on the date above."),
      bullets("Your sign-in stays the same\nYour communities, positions, and applications move with you\nYou may need to sign in again once"),
      text("action", "What you need to do", "Nothing, unless you use custom bot tokens. Those need to be re-entered."),
      ...ctaFields("Read the migration FAQ", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: `Platform move on ${v.date}`,
      heading: "We are moving to new infrastructure",
      paragraphs: splitParas(v.body),
      sections: [
        { title: "What stays the same", bullets: splitLines(v.bullets) },
        { title: "What you need to do", paragraphs: [v.action] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Security =====
  {
    id: "data-breach-notice",
    name: "Data breach notice",
    category: "Security",
    description: "Tell people a security incident may have exposed their data, what happened, and what to do.",
    fields: [
      text("incidentDate", "When it was discovered", "on October 29", { required: true }),
      text("dataTypes", "Information that may be affected", "email addresses and hashed passwords", { required: true, maxLength: 300 }),
      body("We recently discovered unauthorized access to part of the RoleFlow system. We found it on {DATE} and closed the access the same day. We are sorry this happened, and we take the protection of your information seriously."),
      text("passwords", "Password statement", "Passwords are stored as one-way hashes, so they cannot be read back. We still recommend changing yours."),
      bullets("Change your RoleFlow password, and any other account where you reuse it\nTurn on two-factor sign-in in Settings\nBe cautious of unexpected emails asking for passwords or payments\nReply to this email if you notice anything unusual"),
      ...ctaFields("Reset my password", `${DEFAULT_ORIGIN}/auth/forgot-password`),
    ],
    build: (v) => ({
      subject: "Important: a security incident involving your RoleFlow data",
      preheader: "What happened and what to do",
      heading: "A security incident involving your data",
      paragraphs: splitParas(v.body.split("{DATE}").join(v.incidentDate)),
      sections: [
        { title: "Information that may be affected", paragraphs: [v.dataTypes] },
        { title: "About passwords", paragraphs: [v.passwords] },
        { title: "What we recommend", bullets: splitLines(v.bullets) },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "breach-followup",
    name: "Breach follow-up",
    category: "Security",
    description: "The outcome of an investigation after a breach notice, and the protections added since.",
    fields: [
      body("Last week we told you about a security incident. We have now finished our investigation, and this is what we found and what we changed."),
      text("finding", "What the investigation found", "No evidence of access beyond what we described"),
      bullets("Added monitoring that flags unusual access faster\nRotated credentials used by affected services\nStarted an external review of our access controls"),
      ...ctaFields("Read the full update", `${DEFAULT_ORIGIN}/privacy`),
    ],
    build: (v) => ({
      subject: "Update on the security incident",
      heading: "Our investigation is complete",
      paragraphs: splitParas(v.body),
      sections: [
        { title: "What we found", paragraphs: [v.finding] },
        { title: "What we changed", bullets: splitLines(v.bullets) },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "incident-update",
    name: "Incident status update",
    category: "Security",
    description: "A live update while a security incident is still being handled.",
    fields: [
      text("status", "Current status", "Investigating", { required: true }),
      body("We are currently investigating an issue that may affect some RoleFlow features. At this time there is no sign that personal information was accessed. We will send another update when we have more to share."),
      text("next", "Next update", "within 24 hours"),
      ...ctaFields("View status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Security update: ${v.status}`,
      heading: `Status: ${v.status}`,
      paragraphs: splitParas(v.body),
      sections: [{ title: "Next update", paragraphs: [v.next] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "password-reset-required",
    name: "Password reset required",
    category: "Security",
    description: "Ask every affected user to set a new password, with the reason and the steps.",
    fields: [
      body("To keep your account safe, please set a new password for RoleFlow. Your current password will stop working once you request a reset."),
      bullets("Request a reset from the sign-in page\nChoose a password you do not use anywhere else\nTurn on two-factor sign-in after you reset"),
      text("ifNotYou", "If this was not you", "Reply to this email immediately so we can secure the account."),
      ...ctaFields("Set a new password", `${DEFAULT_ORIGIN}/auth/forgot-password`),
    ],
    build: (v) => ({
      subject: "Please reset your RoleFlow password",
      heading: "Please reset your password",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Steps", bullets: splitLines(v.bullets) }, { title: "If this was not you", paragraphs: [v.ifNotYou] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "two-factor-reminder",
    name: "Turn on two-factor sign-in",
    category: "Security",
    description: "Encourage people to add a second step to sign-in, with how it protects them.",
    fields: [
      body("Two-factor sign-in adds a second step when you sign in, so a stolen password alone is not enough to get into your account. It takes about a minute to set up."),
      bullets("Open Settings and choose security\nScan the code with an authenticator app\nSave your recovery codes somewhere safe"),
      ...ctaFields("Turn it on", `${DEFAULT_ORIGIN}/settings`),
    ],
    build: (v) => ({
      subject: "Protect your RoleFlow account in a minute",
      heading: "Add a second step to sign-in",
      paragraphs: splitParas(v.body),
      sections: [{ title: "How to set it up", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "suspicious-login-alert",
    name: "Suspicious sign-in alert",
    category: "Security",
    description: "Tell people about sign-ins from unfamiliar devices and what to do if it was not them.",
    fields: [
      text("when", "When it happened", "last night", { required: true }),
      body("We noticed a sign-in to your RoleFlow account from a device or location we do not usually see for you. If it was you, you can ignore this message."),
      bullets("If it was not you, reset your password right away\nSign out other devices from Settings\nTurn on two-factor sign-in"),
      ...ctaFields("Review my account", `${DEFAULT_ORIGIN}/settings`),
    ],
    build: (v) => ({
      subject: "New sign-in to your RoleFlow account",
      heading: "We noticed a new sign-in",
      paragraphs: splitParas(v.body),
      sections: [{ title: "When", paragraphs: [v.when] }, { title: "What to do", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Support =====
  {
    id: "support-hours-change",
    name: "Support hours change",
    category: "Support",
    description: "Tell people when support is available and how quickly to expect a reply.",
    fields: [
      text("hours", "New support hours", "Monday to Friday, 9 AM to 5 PM ET", { required: true }),
      body("We are updating support hours so the team can focus on quality replies. Urgent security issues are still handled at any time."),
      text("response", "Expected response time", "within two business days"),
      ...ctaFields("Contact support", `${DEFAULT_ORIGIN}/support`),
    ],
    build: (v) => ({
      subject: "Changes to support hours",
      heading: "New support hours",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Hours", paragraphs: [v.hours] }, { title: "Expected reply time", paragraphs: [v.response] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "ticket-follow-up",
    name: "We are working on your request",
    category: "Support",
    description: "A general follow-up to people who contacted support, with what happens next.",
    fields: [
      body("Thank you for contacting RoleFlow support. We are still working on your request and wanted to keep you informed."),
      text("status", "Current status", "We are reviewing the details"),
      bullets("We will reply within two business days\nYou do not need to send anything else right now\nIf anything changes, reply to this email"),
      ...ctaFields("Check my requests", `${DEFAULT_ORIGIN}/support`),
    ],
    build: (v) => ({
      subject: "Update on your RoleFlow support request",
      heading: "We are working on your request",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Where things stand", paragraphs: [v.status] }, { title: "What happens next", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "help-center-update",
    name: "Help center update",
    category: "Support",
    description: "Announce new or rewritten help articles, and where to start.",
    fields: [
      body("We have rewritten and added help articles covering the most common questions. If you have ever been stuck, this is a good place to start."),
      bullets("Setting up your first position\nUnderstanding application statuses\nManaging team members and roles\nExporting your data"),
      ...ctaFields("Browse the help center", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: "New help articles are live",
      heading: "The help center has been updated",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Popular articles", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Legal =====
  {
    id: "terms-update-heads-up",
    name: "Terms update heads-up",
    category: "Legal",
    description: "A plain-language heads-up that the terms are changing, with the link to the full text.",
    fields: [
      text("effective", "Takes effect on", "30 days from today", { required: true }),
      body("We are updating our Terms of Service. The full text is linked below. The changes are summarised here so you know what to expect before they take effect."),
      bullets("What changes: how we describe acceptable use\nWhat stays the same: your ownership of your data\nYou can contact us before the date with any questions"),
      ...ctaFields("Read the full terms", `${DEFAULT_ORIGIN}/terms`),
    ],
    build: (v) => ({
      subject: `Terms of Service update, effective ${v.effective}`,
      heading: "An update to our Terms of Service",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Summary of changes", bullets: splitLines(v.bullets) }, { title: "When", paragraphs: [`Effective ${v.effective}.`] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "privacy-rights-reminder",
    name: "Your privacy controls",
    category: "Legal",
    description: "Remind people how to see, export, or delete their data, and how to ask for help.",
    fields: [
      body("You control the information in your RoleFlow account. This message explains the choices you have and how to use them."),
      bullets("Download a copy of your data from Settings\nChange which emails you receive, including the unsubscribe link at the bottom of every bulk email\nAsk support to remove specific information\nClose your account at any time"),
      ...ctaFields("Open privacy settings", `${DEFAULT_ORIGIN}/privacy`),
    ],
    build: (v) => ({
      subject: "Your privacy choices on RoleFlow",
      heading: "Your privacy choices",
      paragraphs: splitParas(v.body),
      sections: [{ title: "What you can do", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Seasonal =====
  {
    id: "holiday-greeting",
    name: "Holiday greeting",
    category: "Seasonal",
    description: "Seasonal good wishes, with a note on support hours during the break.",
    fields: [
      text("holiday", "Holiday or season", "the holidays", { required: true }),
      body("Wishing you a relaxed and happy {HOLIDAY}. Thank you for another year of building communities together."),
      text("supportNote", "Support note", "Our support team is on reduced hours. We will reply as soon as we can."),
      ...ctaFields("Open RoleFlow", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Happy ${v.holiday} from RoleFlow`,
      heading: `Happy ${v.holiday}`,
      paragraphs: splitParas(v.body.split("{HOLIDAY}").join(v.holiday)),
      sections: [{ title: "Support over the break", paragraphs: [v.supportNote] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "new-year",
    name: "New year kickoff",
    category: "Seasonal",
    description: "Start the year with what is planned and how to get ready.",
    fields: [
      text("year", "Year", "2027", { required: true }),
      body("A new year is a good time to set up your hiring for the months ahead. Here is what we are planning for {YEAR}, and a few things you can do now to get ready."),
      bullets("Better analytics for every community\nFaster application review\nMore ways to customize your site"),
      { ...bullets("Review your open positions and close the ones that are filled\nUpdate your questions for the new season\nInvite a new reviewer to your team", "Get ready"), key: "bullets2" },
      ...ctaFields("See the roadmap", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Our plans for ${v.year}`,
      heading: `Welcome to ${v.year}`,
      paragraphs: splitParas(v.body.split("{YEAR}").join(v.year)),
      sections: [{ title: "What we are building", bullets: splitLines(v.bullets) }, { title: "Get ready", bullets: splitLines(v.bullets2 ?? "") }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "summer-update",
    name: "Summer hiring update",
    category: "Seasonal",
    description: "A seasonal push for summer programs, with tips for running a busy period.",
    fields: [
      body("Summer is a busy time for many communities. Here are a few things that help when applications come in faster than usual."),
      bullets("Set a clear closing date so applicants know when to apply\nUse filters to focus on the strongest applications first\nRespond to every applicant, even with a short note"),
      ...ctaFields("Open the dashboard", `${DEFAULT_ORIGIN}/dashboard`),
    ],
    build: (v) => ({
      subject: "Tips for a busy summer hiring season",
      heading: "Run a busy season well",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Tips", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  // ===== Staff only (verified company addresses of staff) =====
  {
    id: "staff-promotion",
    name: "Staff promotion",
    category: "Staff",
    audience: "staff",
    description: "Announce a promotion or new role to the team, internal only.",
    fields: [
      text("person", "Person being promoted", "Alex Morgan", { required: true }),
      text("newRole", "New role", "Senior support lead", { required: true }),
      body("We are pleased to announce that {PERSON} is moving into the role of {ROLE}. This recognises the work they have done for our communities and the standard they hold the rest of the team to."),
      text("effective", "Effective from", "Monday"),
      bullets("New responsibilities start on the effective date above\nPlease welcome them in the team channel\nQuestions about handover go to your manager"),
      ...ctaFields("Open the staff hub", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: ${v.person} is now ${v.newRole}`,
      preheader: "Internal staff announcement",
      heading: `Congratulations, ${v.person}`,
      paragraphs: splitParas(v.body.split("{PERSON}").join(v.person).split("{ROLE}").join(v.newRole)),
      sections: [{ title: "Effective", paragraphs: [`Effective from ${v.effective}.`] }, { title: "Next steps", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-role-change",
    name: "Staff role or permission change",
    category: "Staff",
    audience: "staff",
    description: "Tell staff their permissions or responsibilities changed, and what they can now do.",
    fields: [
      body("Your access on RoleFlow is changing. The details below explain what is new, what is removed, and who to contact if something does not look right."),
      bullets("Gained: review access for reports\nRemoved: direct account deletion\nUnchanged: application decisions"),
      text("reason", "Reason for the change", "Team restructure for the new support rota"),
      text("contact", "Who to contact", "Your team lead, or the founder for urgent issues"),
      ...ctaFields("Review my access", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: "Internal: your staff access has changed",
      preheader: "What changed for your role",
      heading: "Your staff access has changed",
      paragraphs: splitParas(v.body),
      sections: [
        { title: "What changed", bullets: splitLines(v.bullets) },
        { title: "Why", paragraphs: [v.reason] },
        { title: "Questions", paragraphs: [`Contact ${v.contact}.`] },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-internal-announcement",
    name: "Internal announcement",
    category: "Staff",
    audience: "staff",
    description: "A general announcement for the team: process changes, policy reminders, or events.",
    fields: [
      text("topic", "Topic", "Updated application review process", { required: true }),
      body("We are changing how applications are reviewed. The goal is faster decisions and clearer reasons for every applicant. Please read the details before your next shift."),
      bullets("Decision notes are required for every rejection\nReviews must be recorded within one working day\nUse saved replies for common questions"),
      text("deadline", "Takes effect", "Next Monday"),
      ...ctaFields("Read the process", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: `Internal: ${v.topic}`,
      preheader: "For staff only",
      heading: v.topic,
      paragraphs: splitParas(v.body),
      sections: [{ title: "What to do", bullets: splitLines(v.bullets) }, { title: "Takes effect", paragraphs: [v.deadline] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-training-reminder",
    name: "Staff training reminder",
    category: "Staff",
    audience: "staff",
    description: "Remind staff about a required training session or policy acknowledgement.",
    fields: [
      text("training", "Training or acknowledgement", "Data handling refresher", { required: true }),
      text("due", "Due by", "Friday at 5 PM ET", { required: true }),
      body("Please complete the training below by the due date. It covers how to handle personal information in reviews, reports, and support tickets."),
      bullets("Takes about 20 minutes\nIncludes a short check at the end\nYour completion is recorded automatically"),
      ...ctaFields("Start the training", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: ${v.training} due ${v.due}`,
      preheader: "Required staff training",
      heading: v.training,
      paragraphs: splitParas(v.body),
      sections: [{ title: "Due", paragraphs: [v.due] }, { title: "Details", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  // ===== Operations (service notices; ignore the marketing opt-out) =====
  {
    id: "website-status-update",
    name: "Website status update",
    category: "Operations",
    description: "Current status of the website and services, with what is affected and when we expect the next update.",
    fields: [
      text("status", "Current status", "All systems operational", { required: true }),
      body("We are sharing the current status of RoleFlow. Below is what is working, what is affected, and when you can expect the next update."),
      bullets("Website: operational\nApplications: operational\nDashboard: operational\nEmails: operational"),
      text("nextUpdate", "Next update expected", "Within 24 hours"),
      ...ctaFields("View the status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `RoleFlow status: ${v.status}`,
      preheader: "Current service status",
      heading: "Service status",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Current status", paragraphs: [v.status] }, { title: "Services", bullets: splitLines(v.bullets) }, { title: "Next update", paragraphs: [v.nextUpdate] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "service-degradation",
    name: "Service slowdown",
    category: "Operations",
    description: "Some features are slow or partly unavailable. Explains what is affected and what to do.",
    fields: [
      text("feature", "Affected feature", "Application submission", { required: true }),
      body("Some people are seeing slow responses in {FEATURE}. Our team is working on it, and most features still work as normal. Your data is safe."),
      bullets("Submitted applications are saved, even if the page is slow\nRetry after a few minutes if a button does not respond\nNo action is needed on your side"),
      text("started", "Started", "Today at 10:00 AM ET"),
      ...ctaFields("Check the status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Slow response: ${v.feature}`,
      preheader: "We are working on a slowdown",
      heading: `${v.feature} is slow right now`,
      paragraphs: splitParas(v.body.split("{FEATURE}").join(v.feature)),
      sections: [{ title: "What to do", bullets: splitLines(v.bullets) }, { title: "Started", paragraphs: [v.started] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "service-restored",
    name: "Service restored",
    category: "Operations",
    description: "Tell people a problem is fixed and whether anything needs to be done again.",
    fields: [
      text("feature", "Feature that is back", "Emails", { required: true }),
      body("The problem affecting {FEATURE} is fixed and everything is working again. Thank you for your patience while we worked on it."),
      text("duration", "How long it was affected", "About 2 hours"),
      bullets("Messages that were delayed have now been sent\nNo changes are needed to your account\nIf you still see a problem, reply to support"),
      ...ctaFields("Open RoleFlow", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Resolved: ${v.feature} is working again`,
      preheader: "The issue is resolved",
      heading: `${v.feature} is back`,
      paragraphs: splitParas(v.body.split("{FEATURE}").join(v.feature)),
      sections: [{ title: "How long it was affected", paragraphs: [v.duration] }, { title: "What to know", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "email-delivery-delay",
    name: "Email delivery delay",
    category: "Operations",
    description: "Notice that emails such as application updates are arriving late.",
    fields: [
      body("Emails from RoleFlow, including application updates and sign-in codes, are arriving later than usual. Every message is queued and will be delivered. You do not need to resend anything."),
      text("since", "Since", "Yesterday evening"),
      bullets("Check your spam folder for messages from RoleFlow\nSign-in codes expire after 10 minutes, so request a new one if it is late\nWe will confirm when delivery is back to normal"),
      ...ctaFields("Check the status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "Some emails are arriving late",
      preheader: "Delivery is delayed, nothing is lost",
      heading: "Emails are arriving late",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Since", paragraphs: [v.since] }, { title: "What to know", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "planned-database-work",
    name: "Planned database work",
    category: "Operations",
    description: "Scheduled database work with the window and what will be read-only during it.",
    fields: [
      text("window", "Window", "Sunday 2:00 to 3:00 AM ET", { required: true }),
      body("We are running planned database maintenance to keep RoleFlow fast and reliable. During the window, you can browse, but applications and changes may be paused for a few minutes."),
      bullets("Applications may fail to save for a few minutes\nNo data will be lost\nWe will post when the work is finished"),
      ...ctaFields("See the status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Planned maintenance: ${v.window}`,
      preheader: "Scheduled database work",
      heading: "Planned database maintenance",
      paragraphs: splitParas(v.body),
      sections: [{ title: "When", paragraphs: [v.window] }, { title: "What to expect", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "new-region-launch",
    name: "New region or server launch",
    category: "Operations",
    description: "Announce faster service in a new region or a new server location.",
    fields: [
      text("region", "Region", "Europe", { required: true }),
      body("RoleFlow now runs a server in {REGION}. Pages load faster for people nearby, and nothing needs to change on your side."),
      bullets("Faster page loads for communities in this region\nYour data stays where it is today\nNo changes to sign-in or applications"),
      ...ctaFields("Open RoleFlow", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Faster in ${v.region}`,
      preheader: "A new server location is live",
      heading: `RoleFlow is now faster in ${v.region}`,
      paragraphs: splitParas(v.body.split("{REGION}").join(v.region)),
      sections: [{ title: "What changes", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Staffing (hiring and opportunities for community teams) =====
  {
    id: "staffing-open-roles",
    name: "Open staff roles",
    category: "Staffing",
    audience: "all",
    description: "Announce that communities are recruiting staff and link to the open roles.",
    fields: [
      text("roles", "Roles open", "Moderator, recruiter, and developer", { required: true }),
      body("Communities on RoleFlow are looking for new team members. If you want to help run a community, moderate, recruit, or build, now is a good time to apply."),
      bullets("Browse open positions across the directory\nApply once and track every application in one place\nCommunity teams review applications within a few days"),
      text("deadline", "Applications close", "Friday, 5 PM ET"),
      ...ctaFields("Browse open roles", `${DEFAULT_ORIGIN}/browse`),
    ],
    build: (v) => ({
      subject: `Open roles: ${v.roles}`,
      preheader: "Communities are hiring",
      heading: "Help a community grow",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Roles open", paragraphs: [v.roles] }, { title: "How it works", bullets: splitLines(v.bullets) }, { title: "Deadline", paragraphs: [v.deadline] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staffing-moderator-call",
    name: "Moderator recruitment call",
    category: "Staffing",
    audience: "all",
    description: "A call for moderators for one community, with what the role involves.",
    fields: [
      text("community", "Community name", "Lumen Studios", { required: true }),
      body("{COMMUNITY} is looking for moderators who are active, fair, and comfortable helping new members. Experience is helpful but not required."),
      bullets("Around 5 hours a week\nTraining is provided\nYou can apply through RoleFlow in a few minutes"),
      text("deadline", "Apply by", "End of next week"),
      ...ctaFields("Apply now", `${DEFAULT_ORIGIN}/browse`),
    ],
    build: (v) => ({
      subject: `${v.community} is hiring moderators`,
      preheader: "Moderator roles are open",
      heading: `Moderators wanted at ${v.community}`,
      paragraphs: splitParas(v.body.split("{COMMUNITY}").join(v.community)),
      sections: [{ title: "What to expect", bullets: splitLines(v.bullets) }, { title: "Apply by", paragraphs: [v.deadline] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staffing-interview-tips",
    name: "Application and interview tips",
    category: "Staffing",
    audience: "all",
    description: "Practical advice for people applying to community teams.",
    fields: [
      body("Strong applications are specific and honest. Teams want to see how you think, what you have done, and how you handle disagreement. These tips help your application stand out."),
      bullets("Answer each question fully, even if the answer is short\nGive one concrete example instead of a list of traits\nSay when you are not sure how something works\nCheck your availability before you apply"),
      note("Good luck. Every team reads each application, even when there are many."),
      ...ctaFields("Start an application", `${DEFAULT_ORIGIN}/browse`),
    ],
    build: (v) => ({
      subject: "Tips for applying to community teams",
      preheader: "Make your application stand out",
      heading: "Apply with confidence",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Tips", bullets: splitLines(v.bullets) }],
      footnote: v.note,
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staffing-trial-period",
    name: "Trial period opportunity",
    category: "Staffing",
    audience: "all",
    description: "Invite people to a short trial period on a team before a full role.",
    fields: [
      text("role", "Role", "Recruiter", { required: true }),
      body("Some teams offer a short trial period so both sides can see if it is a good fit. For the {ROLE} role, the trial lasts a few weeks with a clear checklist and regular feedback."),
      bullets("Clear start and end dates\nFeedback at the end of each week\nNo commitment beyond the trial"),
      ...ctaFields("See trial roles", `${DEFAULT_ORIGIN}/browse`),
    ],
    build: (v) => ({
      subject: `Trial period: ${v.role}`,
      preheader: "Try a role before committing",
      heading: `Try the ${v.role} role`,
      paragraphs: splitParas(v.body.split("{ROLE}").join(v.role)),
      sections: [{ title: "How it works", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staffing-hiring-pause",
    name: "Hiring pause notice",
    category: "Staffing",
    audience: "all",
    description: "Tell applicants that a community has paused hiring, and when to check back.",
    fields: [
      text("community", "Community name", "Lumen Studios", { required: true }),
      body("{COMMUNITY} has paused new applications while the team reviews its current applications. Your existing applications are not affected."),
      text("reopen", "Expected to reopen", "Next month"),
      note("You can follow the community to hear when hiring opens again."),
      ...ctaFields("View communities", `${DEFAULT_ORIGIN}/browse`),
    ],
    build: (v) => ({
      subject: `${v.community} has paused hiring`,
      preheader: "Applications are paused for now",
      heading: `${v.community} is pausing hiring`,
      paragraphs: splitParas(v.body.split("{COMMUNITY}").join(v.community)),
      sections: [{ title: "Expected to reopen", paragraphs: [v.reopen] }],
      footnote: v.note,
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staffing-community-team-spotlight",
    name: "Community team spotlight",
    category: "Staffing",
    audience: "all",
    description: "Highlight a community team and the kind of people it is looking for.",
    fields: [
      text("community", "Community name", "Lumen Studios", { required: true }),
      body("This month we are highlighting {COMMUNITY}. The team is looking for people who like organising events, answering questions, and keeping a community welcoming."),
      bullets("Team of 12 across three time zones\nWeekly planning call\nOpen roles in recruitment and events"),
      ...ctaFields("Meet the team", `${DEFAULT_ORIGIN}/browse`),
    ],
    build: (v) => ({
      subject: `Team spotlight: ${v.community}`,
      preheader: "Meet a community team",
      heading: `Inside ${v.community}`,
      paragraphs: splitParas(v.body.split("{COMMUNITY}").join(v.community)),
      sections: [{ title: "About the team", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Community and polls =====
  {
    id: "poll-invite",
    name: "Poll invitation",
    category: "Community",
    description: "Invite people to vote in an open RoleFlow poll.",
    fields: [
      text("question", "Poll question", "What would you like to see next?", { required: true }),
      body("We are asking the community what to build next. Your choice helps decide what we work on. It takes about 10 seconds."),
      note("You can vote once. Results are shared when the poll closes."),
      text("closes", "Poll closes", "Friday"),
      ...ctaFields("Vote now", `${DEFAULT_ORIGIN}/polls`),
    ],
    build: (v) => ({
      subject: `Poll: ${v.question}`,
      preheader: "Your vote matters",
      heading: v.question,
      paragraphs: splitParas(v.body),
      sections: [{ title: "Closes", paragraphs: [v.closes] }],
      footnote: v.note,
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "poll-results",
    name: "Poll results",
    category: "Community",
    description: "Share the results of a closed poll and what happens next.",
    fields: [
      text("question", "Poll question", "What would you like to see next?", { required: true }),
      body("Thank you to everyone who voted on {QUESTION}. Here is what the community chose, and what we plan to do with it."),
      bullets("First choice: the top option\nSecond choice: the next option\nWe read every written suggestion too"),
      text("next", "What happens next", "We will share a plan in next month's newsletter"),
      ...ctaFields("See the results", `${DEFAULT_ORIGIN}/polls`),
    ],
    build: (v) => ({
      subject: `Results: ${v.question}`,
      preheader: "The community has spoken",
      heading: "Poll results are in",
      paragraphs: splitParas(v.body.split("{QUESTION}").join(v.question)),
      sections: [{ title: "Highlights", bullets: splitLines(v.bullets) }, { title: "What happens next", paragraphs: [v.next] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "community-event-recap",
    name: "Community event recap",
    category: "Community",
    description: "Recap a community event, with highlights and a thank you.",
    fields: [
      text("event", "Event name", "Community town hall", { required: true }),
      body("Thank you to everyone who joined {EVENT}. Here are the highlights, the questions we answered, and what is coming next."),
      bullets("Over 80 people joined live\nThree new features were demoed\nRecording is available for anyone who missed it"),
      ...ctaFields("Watch the recording", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Recap: ${v.event}`,
      preheader: "Highlights from the event",
      heading: `Thanks for joining ${v.event}`,
      paragraphs: splitParas(v.body.split("{EVENT}").join(v.event)),
      sections: [{ title: "Highlights", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "community-contest",
    name: "Community contest",
    category: "Community",
    description: "Invite the community to enter a contest with clear rules and a deadline.",
    fields: [
      text("contest", "Contest name", "Best community banner", { required: true }),
      body("We are running {CONTEST}. Share your entry, follow the rules below, and the winners will be announced on the official channels."),
      bullets("Entries close on the deadline below\nOne entry per person\nWinners are chosen by the RoleFlow team"),
      text("deadline", "Entries close", "Sunday at midnight ET"),
      ...ctaFields("Read the rules", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Enter: ${v.contest}`,
      preheader: "A community contest is open",
      heading: v.contest,
      paragraphs: splitParas(v.body.split("{CONTEST}").join(v.contest)),
      sections: [{ title: "Rules", bullets: splitLines(v.bullets) }, { title: "Deadline", paragraphs: [v.deadline] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "community-new-partner",
    name: "New partner announcement",
    category: "Community",
    description: "Announce a new partner community, partnership, or integration.",
    fields: [
      text("partner", "Partner name", "Harbor Creators", { required: true }),
      body("We are happy to welcome {PARTNER} as a RoleFlow partner. Partners get extra visibility in the directory and early access to new features."),
      bullets("Featured in the community directory\nEarly access to new features\nA direct line to the RoleFlow team"),
      ...ctaFields("See the partner", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Welcome, ${v.partner}`,
      preheader: "A new partner joins RoleFlow",
      heading: `Welcome ${v.partner}`,
      paragraphs: splitParas(v.body.split("{PARTNER}").join(v.partner)),
      sections: [{ title: "What partners get", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Support =====
  {
    id: "support-backlog-update",
    name: "Support backlog update",
    category: "Support",
    description: "Tell users that support is busy and what the expected reply time is.",
    fields: [
      text("reply", "Typical reply time", "Within 2 business days", { required: true }),
      body("Our support team is handling a higher than usual number of requests right now. We read every message, and we are replying in the order they arrived."),
      bullets("Check the help pages first, they may answer your question\nInclude your community name and what you tried\nUrgent account security issues are handled first"),
      ...ctaFields("Open the help pages", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: "Support is busier than usual",
      preheader: "Here is what to expect",
      heading: "Support is busy right now",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Typical reply time", paragraphs: [v.reply] }, { title: "Before you write in", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "support-new-channel",
    name: "New support channel",
    category: "Support",
    description: "Announce a new way to contact support, with hours and what it is for.",
    fields: [
      text("channel", "Channel", "Live chat", { required: true }),
      body("You can now reach the RoleFlow support team through {CHANNEL}. It is the fastest way to get help with access, applications, or community setup."),
      text("hours", "Hours", "Weekdays, 9 AM to 5 PM ET"),
      bullets("Email support remains available at any time\nFor account security, use the sign-in help page\nPlease do not share passwords or codes"),
      ...ctaFields("Get support", `${DEFAULT_ORIGIN}/support`),
    ],
    build: (v) => ({
      subject: `Support is now on ${v.channel}`,
      preheader: "A new way to reach support",
      heading: `Get help on ${v.channel}`,
      paragraphs: splitParas(v.body.split("{CHANNEL}").join(v.channel)),
      sections: [{ title: "Hours", paragraphs: [v.hours] }, { title: "Good to know", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },

  // ===== Staff (internal, verified company addresses only) =====
  {
    id: "staff-shift-schedule",
    name: "Shift schedule update",
    category: "Staff",
    audience: "staff",
    description: "Share the new shift rota and any cover changes.",
    fields: [
      text("week", "Week", "Week of 2 November", { required: true }),
      body("The shift rota for {WEEK} is now published. Please check your slots and tell your team lead before the end of the day if you cannot make a shift."),
      bullets("Swaps must be agreed with the person you are swapping with\nHandover notes go in the staff channel\nUrgent cover requests go to your team lead"),
      ...ctaFields("Open the rota", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: shift rota for ${v.week}`,
      preheader: "Staff rota is published",
      heading: "Shift rota published",
      paragraphs: splitParas(v.body.split("{WEEK}").join(v.week)),
      sections: [{ title: "Rules", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-weekly-digest",
    name: "Weekly staff digest",
    category: "Staff",
    audience: "staff",
    description: "A short weekly summary of the team's work, numbers, and wins.",
    fields: [
      text("week", "Week ending", "Friday", { required: true }),
      body("Here is a summary of what the team got done this week. Thank you for the time and care you put into every review and every ticket."),
      bullets("Applications reviewed: see the dashboard\nSupport tickets closed: see the support panel\nNew features shipped: see the changelog"),
      note("Share a win in the staff channel if you want it in next week's digest."),
      ...ctaFields("Open the staff hub", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: weekly digest, week ending ${v.week}`,
      preheader: "Your team this week",
      heading: "This week at RoleFlow",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Highlights", bullets: splitLines(v.bullets) }],
      footnote: v.note,
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-review-backlog",
    name: "Review backlog alert",
    category: "Staff",
    audience: "staff",
    description: "Ask staff to help clear a backlog of applications or reports.",
    fields: [
      text("count", "Items waiting", "120 applications", { required: true }),
      body("We have {COUNT} waiting for review. Applicants are waiting on decisions, so please pick up what you can in your next shift. Record a reason for every decision."),
      bullets("Start with the oldest items first\nUse saved replies for common questions\nAsk in the staff channel if a case needs a second opinion"),
      text("target", "Target to clear by", "End of the week"),
      ...ctaFields("Open the review queue", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: ${v.count} waiting for review`,
      preheader: "Help clear the queue",
      heading: "The review queue needs help",
      paragraphs: splitParas(v.body.split("{COUNT}").join(v.count)),
      sections: [{ title: "How to help", bullets: splitLines(v.bullets) }, { title: "Target", paragraphs: [v.target] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-policy-update",
    name: "Staff policy update",
    category: "Staff",
    audience: "staff",
    description: "Tell staff a team policy changed and ask them to read it.",
    fields: [
      text("policy", "Policy", "Handling personal data in reviews", { required: true }),
      body("We have updated our internal policy on {POLICY}. The changes clarify what you can record, how long to keep it, and when to escalate."),
      bullets("Read the full policy before your next shift\nAcknowledge it in the staff hub\nAsk your team lead about anything unclear"),
      text("effective", "Effective", "Monday"),
      ...ctaFields("Read the policy", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: `Internal: updated policy on ${v.policy}`,
      preheader: "Please read the update",
      heading: "Policy update",
      paragraphs: splitParas(v.body.split("{POLICY}").join(v.policy)),
      sections: [{ title: "What to do", bullets: splitLines(v.bullets) }, { title: "Effective", paragraphs: [v.effective] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-recognition",
    name: "Staff recognition",
    category: "Staff",
    audience: "staff",
    description: "Recognise a team member for their work.",
    fields: [
      text("person", "Person", "Alex Morgan", { required: true }),
      body("We want to recognise {PERSON} for their work this month. Their care with applicants and their calm handling of a difficult week made a real difference to the team."),
      bullets("Went above and beyond on support tickets\nHelped new staff settle in\nLed the review queue clean-up"),
      ...ctaFields("Say thanks in the staff channel", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: thank you, ${v.person}`,
      preheader: "Recognising great work",
      heading: `Thank you, ${v.person}`,
      paragraphs: splitParas(v.body.split("{PERSON}").join(v.person)),
      sections: [{ title: "Highlights", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-onboarding-welcome",
    name: "New staff welcome",
    category: "Staff",
    audience: "staff",
    description: "Welcome a new team member and point them to their first steps.",
    fields: [
      text("person", "New team member", "Jordan Lee", { required: true }),
      body("Welcome to the team, {PERSON}. We are glad to have you. Your first week is about learning the tools, shadowing a shift, and asking questions."),
      bullets("Complete the security setup and two-factor sign-in\nRead the staff handbook\nShadow a shift with your team lead\nIntroduce yourself in the staff channel"),
      text("start", "First day", "Monday at 10 AM ET"),
      ...ctaFields("Open the staff handbook", `${DEFAULT_ORIGIN}/docs`),
    ],
    build: (v) => ({
      subject: `Welcome to the team, ${v.person}`,
      preheader: "Your first steps",
      heading: `Welcome, ${v.person}`,
      paragraphs: splitParas(v.body.split("{PERSON}").join(v.person)),
      sections: [{ title: "Your first week", bullets: splitLines(v.bullets) }, { title: "First day", paragraphs: [v.start] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-offboarding",
    name: "Staff offboarding",
    category: "Staff",
    audience: "staff",
    description: "Confirm a team member has left and what access is removed.",
    fields: [
      text("person", "Team member", "Jordan Lee", { required: true }),
      body("{PERSON} has left the team. Thank you for their work. Their staff access has been removed. Please do not share their pending work outside the team."),
      bullets("Staff access removed on the last day\nPending reviews reassigned by the team lead\nHandover notes saved in the staff channel"),
      text("lastDay", "Last day", "Friday"),
      ...ctaFields("Open the staff hub", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: ${v.person} has left the team`,
      preheader: "Staff update",
      heading: `Goodbye, ${v.person}`,
      paragraphs: splitParas(v.body.split("{PERSON}").join(v.person)),
      sections: [{ title: "Last day", paragraphs: [v.lastDay] }, { title: "What happens now", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-security-reminder",
    name: "Staff security reminder",
    category: "Staff",
    audience: "staff",
    description: "Remind staff about account security, two-factor sign-in, and never sharing codes.",
    fields: [
      body("Please check that two-factor sign-in is on for your account. Never share a password, a sign-in code, or a support code with anyone, even someone who says they are from RoleFlow."),
      bullets("Turn on two-factor sign-in in Settings\nUse a unique password\nReport suspicious messages to the founder right away"),
      text("deadline", "Please do this by", "End of this week"),
      ...ctaFields("Open security settings", `${DEFAULT_ORIGIN}/settings`),
    ],
    build: (v) => ({
      subject: "Internal: please check your account security",
      preheader: "Staff security reminder",
      heading: "Keep your account secure",
      paragraphs: splitParas(v.body),
      sections: [{ title: "Do this", bullets: splitLines(v.bullets) }, { title: "By when", paragraphs: [v.deadline] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-meeting-invite",
    name: "Staff meeting invitation",
    category: "Staff",
    audience: "staff",
    description: "Invite the team to a meeting with the agenda and time.",
    fields: [
      text("meeting", "Meeting", "Monthly team call", { required: true }),
      text("when", "When", "Thursday at 6 PM ET", { required: true }),
      body("You are invited to the {MEETING} on {WHEN}. We will cover the month's priorities, open questions, and time for anything you want to raise."),
      bullets("Agenda: priorities, shift changes, open questions\nBring one item you want to discuss\nNotes will be shared afterwards"),
      ...ctaFields("Add to my calendar", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: `Internal: ${v.meeting}, ${v.when}`,
      preheader: "You are invited",
      heading: v.meeting,
      paragraphs: splitParas(v.body.split("{MEETING}").join(v.meeting).split("{WHEN}").join(v.when)),
      sections: [{ title: "When", paragraphs: [v.when] }, { title: "Agenda", bullets: splitLines(v.bullets) }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "staff-incident-response",
    name: "Staff incident response",
    category: "Staff",
    audience: "staff",
    description: "Tell the team an incident is in progress and what each person should do now.",
    fields: [
      text("incident", "Incident", "Email delivery delay", { required: true }),
      body("We are responding to {INCIDENT}. Please do not post about it outside the staff channel, and do not promise applicants a timeline until the incident lead confirms one."),
      bullets("Follow the incident lead's instructions\nLog any applicant questions in the staff channel\nDo not change settings until the all-clear"),
      text("lead", "Incident lead", "The on-call admin"),
      ...ctaFields("Open the incident channel", `${DEFAULT_ORIGIN}/admin`),
    ],
    build: (v) => ({
      subject: `Internal: incident response, ${v.incident}`,
      preheader: "Incident in progress",
      heading: "Incident in progress",
      paragraphs: splitParas(v.body.split("{INCIDENT}").join(v.incident)),
      sections: [{ title: "What to do now", bullets: splitLines(v.bullets) }, { title: "Incident lead", paragraphs: [v.lead] }],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "unscheduled-maintenance",
    name: "Unscheduled maintenance",
    category: "Operations",
    description: "Tell people RoleFlow is paused for unplanned maintenance and will show the maintenance screen until it is finished.",
    fields: [
      text("reason", "What we are fixing", "a problem with our servers", { required: true }),
      body("We need to pause RoleFlow for unscheduled maintenance to deal with {REASON}. While we work on it, the site will show a maintenance screen, and you will not be able to sign in, apply, or manage your community."),
      text("expected", "Expected back", "Within the next few hours"),
      bullets("Applications you already submitted are safe\nNothing you have saved will be lost\nWe will update the status page as we go"),
      ...ctaFields("Check the status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({
      subject: "RoleFlow is paused for unscheduled maintenance",
      preheader: "The site is temporarily unavailable",
      heading: "RoleFlow is temporarily paused",
      paragraphs: splitParas(v.body.split("{REASON}").join(v.reason)),
      sections: [
        { title: "Expected back", paragraphs: [v.expected] },
        { title: "What to know", bullets: splitLines(v.bullets) },
      ],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
];

export const TEMPLATES: Template[] = T;

export function templateAudience(tpl: Template | null | undefined): Audience {
  return tpl?.audience ?? "all";
}

/**
 * Service notices: security and operations messages about the account or the platform itself.
 * These ignore the bulk opt-out list. Marketing, product, growth, community, and staff messages honor it.
 */
export function isTransactional(tpl: Template | null | undefined): boolean {
  return tpl?.category === "Security" || tpl?.category === "Operations";
}

export function getTemplate(id: string): Template | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

// ---------- rendering ----------

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only https links. Blocks javascript:, data:, http, and links with embedded credentials. */
export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.username === "" && u.password === "";
  } catch {
    return false;
  }
}

export class TemplateInputError extends Error {}

/** Validates and trims the user's values against the template's fields. Throws TemplateInputError. */
export function normalizeValues(tpl: Template, raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of tpl.fields) {
    const value = typeof raw[f.key] === "string" ? (raw[f.key] as string).trim() : f.default;
    if (f.required && !value) throw new TemplateInputError(`"${f.label}" is required.`);
    if (value.length > f.maxLength) throw new TemplateInputError(`"${f.label}" must be ${f.maxLength} characters or fewer.`);
    if (f.url && value && !isSafeUrl(value)) throw new TemplateInputError(`"${f.label}" must be an https:// link.`);
    // Strip control characters that could break headers or layout.
    out[f.key] = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  }
  return out;
}

const FOOTER_TEXT = "You are receiving this because you have a RoleFlow account or a verified company address linked to one.";

/**
 * Full render: subject, HTML, and plain text. Same output on the preview and on the live send.
 * Pass unsubscribeUrl for bulk campaigns; it adds the unsubscribe link to the footer.
 */
/**
 * The built content for a template. Every email gets at least two sections: short templates get a
 * standard "Questions?" section, so no message ends abruptly.
 */
export function buildTemplate(tpl: Template, values: Record<string, string>): Built {
  const b = tpl.build(values);
  const sections = [...(b.sections ?? [])];
  const fillers: Section[] = [
    {
      title: "Questions?",
      paragraphs: ["Reply to this email, or visit the RoleFlow help center. A real person reads every reply, and we aim to respond within two business days."],
    },
    {
      title: "Stay in touch",
      paragraphs: ["Read the changelog for everything we ship, and send feedback whenever something could work better."],
    },
  ];
  for (const f of fillers) {
    if (sections.length >= 2) break;
    sections.push(f);
  }
  return { ...b, sections };
}

export function renderEmail(
  tpl: Template,
  raw: Record<string, unknown>,
  recipientName: string | null | undefined,
  opts: { unsubscribeUrl?: string } = {}
): RenderedEmail {
  const v = normalizeValues(tpl, raw);
  const b = buildTemplate(tpl, v);
  if (b.cta && !isSafeUrl(b.cta.url)) throw new TemplateInputError("The button link must be https://.");

  const name = (recipientName ?? "").trim();
  const greet = name ? `Hi ${name},` : "Hi there,";
  const subject = b.subject.replace(/[\r\n]+/g, " ").slice(0, 150);
  const preheader = optional(b.preheader);

  const paras = (ps: string[]) =>
    ps.map((p) => `<p style="margin:0 0 14px;line-height:1.6;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
  const list = (items: string[]) =>
    items.length ? `<ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">${items.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : "";

  const sectionsHtml = (b.sections ?? [])
    .filter((s) => (s.paragraphs ?? []).some(Boolean) || (s.bullets ?? []).length > 0)
    .map(
      (s) =>
        `<h2 style="font-size:15px;margin:22px 0 8px;color:#161512;">${escapeHtml(s.title)}</h2>${paras((s.paragraphs ?? []).filter(Boolean))}${list(s.bullets ?? [])}`
    )
    .join("");

  const cta = b.cta
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(b.cta.url)}" style="display:inline-block;background:#e5532d;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">${escapeHtml(b.cta.label)}</a></p>`
    : "";

  const footerLinkHtml = opts.unsubscribeUrl
    ? ` <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#6b665c;">Unsubscribe from these emails</a>.`
    : " You can turn off these emails in Settings.";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#161512;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;padding:30px;">
    <p style="margin:0 0 14px;">${escapeHtml(greet)}</p>
    <h1 style="font-size:21px;margin:0 0 16px;">${escapeHtml(b.heading)}</h1>
    ${paras(b.paragraphs)}
    ${sectionsHtml}
    ${list(b.bullets ?? [])}
    ${cta}
    ${b.footnote ? `<p style="margin:0 0 14px;line-height:1.6;color:#3b3831;">${escapeHtml(b.footnote)}</p>` : ""}
    <p style="margin:28px 0 0;font-size:12px;color:#6b665c;border-top:1px solid #eee;padding-top:14px;line-height:1.5;">${FOOTER_TEXT}${footerLinkHtml}</p>
  </div></body></html>`;

  const sectionsText = (b.sections ?? [])
    .filter((s) => (s.paragraphs ?? []).some(Boolean) || (s.bullets ?? []).length > 0)
    .flatMap((s) => [
      s.title.toUpperCase(),
      ...(s.paragraphs ?? []).filter(Boolean),
      ...(s.bullets ?? []).map((x) => `  - ${x}`),
      "",
    ]);

  const text = [
    greet,
    "",
    b.heading,
    "",
    ...b.paragraphs.flatMap((p) => [p, ""]),
    ...sectionsText,
    ...(b.bullets ?? []).map((x) => `  - ${x}`),
    ...(b.cta ? ["", `${b.cta.label}: ${b.cta.url}`] : []),
    ...(b.footnote ? ["", b.footnote] : []),
    "",
    FOOTER_TEXT + (opts.unsubscribeUrl ? ` Unsubscribe from these emails: ${opts.unsubscribeUrl}` : " You can turn off these emails in Settings."),
  ].join("\n");

  return { subject, html, text };
}
