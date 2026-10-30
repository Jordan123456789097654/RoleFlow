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
  "Operations",
  "Security",
  "Support",
  "Legal",
  "Seasonal",
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

export type Template = {
  id: string;
  name: string;
  category: Category;
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
      sections: [{ title: `What you get with ${v.plan}`, bullets: splitLines(v.bullets) }, { title: "Existing plans", paragraphs: ["Your current plan keeps working. You can switch at any time from the billing page."] }],
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
];

export const TEMPLATES: Template[] = T;

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
