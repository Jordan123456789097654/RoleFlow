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

export type Built = {
  subject: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  cta?: { label: string; url: string };
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
const body = (def: string, label = "Message"): FieldDef => ({
  key: "body", label, default: def, multiline: true, required: true, maxLength: 4000,
  help: "Separate paragraphs with a blank line.",
});
const bullets = (def: string, label = "Bullet points"): FieldDef => ({
  key: "bullets", label, default: def, multiline: true, maxLength: 2000,
  help: "One item per line. Leave empty to skip.",
});
const ctaFields = (label: string, url: string): FieldDef[] => [
  text("ctaLabel", "Button text", label, { maxLength: 40 }),
  text("ctaUrl", "Button link (https)", url, { url: true, maxLength: 300 }),
];

const splitParas = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const splitLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

// ---------- templates ----------

const T: Template[] = [
  {
    id: "product-launch",
    name: "Product launch",
    category: "Announcements",
    description: "Announce something new that is ready to use today.",
    fields: [text("title", "Headline", "Something new is here", { required: true }), body("We just launched a new way to run your community hiring.\n\nIt is ready for you to try today."), ...ctaFields("See what's new", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: v.title, heading: v.title, paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "feature-update",
    name: "Feature update",
    category: "Product",
    description: "Tell people about a feature that changed or was improved.",
    fields: [text("feature", "Feature name", "Application reviews", { required: true }), body("We rebuilt how reviews work so you can score applicants faster.\n\nYour existing data is unchanged."), ...ctaFields("Try it out", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `Update: ${v.feature} is better`, heading: `${v.feature} got an upgrade`, paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "changelog-highlights",
    name: "Changelog highlights",
    category: "Product",
    description: "A short list of what shipped this month.",
    fields: [text("version", "Version or month", "This month"), bullets("Faster dashboard loading\nNew bulk actions for applications\nBetter mobile layout"), body("Here is what we shipped recently."), ...ctaFields("Read the full changelog", `${DEFAULT_ORIGIN}/changelog`)],
    build: (v) => ({ subject: `What's new: ${v.version}`, heading: `What's new in ${v.version}`, paragraphs: splitParas(v.body), bullets: splitLines(v.bullets), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "monthly-newsletter",
    name: "Monthly newsletter",
    category: "Announcements",
    description: "A regular roundup of news, tips, and updates.",
    fields: [text("month", "Month", "This month", { required: true }), body("Thanks for being part of RoleFlow.\n\nHere is a quick look at what happened and what is coming next."), bullets("A new guide on writing good interview questions\nCommunity spotlight of the month\nUpcoming maintenance window"), ...ctaFields("Open RoleFlow", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `RoleFlow newsletter: ${v.month}`, heading: `${v.month} at RoleFlow`, paragraphs: splitParas(v.body), bullets: splitLines(v.bullets), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "pricing-change",
    name: "Pricing change",
    category: "Announcements",
    description: "Explain an upcoming price or plan change, with notice.",
    fields: [text("effective", "Takes effect on", "next month", { required: true }), body("We are updating our plans to cover the cost of running the platform.\n\nIf you are on a current plan, your price will not change until the date above.\n\nQuestions? Reply to this email or contact support."), ...ctaFields("View plans", `${DEFAULT_ORIGIN}/billing`)],
    build: (v) => ({ subject: `Pricing update, effective ${v.effective}`, heading: "An update to our pricing", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "plan-offer",
    name: "Limited-time offer",
    category: "Growth",
    description: "Promote a discount or upgrade offer with a deadline.",
    fields: [text("offer", "Offer", "30% off Pro for one year", { required: true }), text("deadline", "Deadline", "Sunday at midnight", { required: true }), body("For a short time, you can upgrade to Pro at a discount.\n\nPro adds more communities, custom domains, and advanced analytics."), ...ctaFields("Claim the offer", `${DEFAULT_ORIGIN}/billing`)],
    build: (v) => ({ subject: `${v.offer}, ends ${v.deadline}`, heading: v.offer, paragraphs: [...splitParas(v.body), `Offer ends ${v.deadline}.`], cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "beta-invite",
    name: "Beta invitation",
    category: "Growth",
    description: "Invite people to try an early feature.",
    fields: [text("feature", "Beta feature", "the new community site builder", { required: true }), body("You are invited to try {FEATURE} before everyone else.\n\nYour feedback will shape the final version. It takes about 10 minutes to try it out."), ...ctaFields("Join the beta", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: "You're invited to the RoleFlow beta", heading: "You're invited to the beta", paragraphs: splitParas(fill(v.body, "{FEATURE}", v.feature)), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "feedback-survey",
    name: "Feedback survey",
    category: "Growth",
    description: "Ask users for a few minutes of feedback.",
    fields: [body("We are working on the next version of RoleFlow and would love your opinion.\n\nThe survey takes about three minutes. Every answer is read."), text("time", "Time it takes", "about three minutes"), ...ctaFields("Take the survey", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: "Got three minutes for us?", heading: "Help us build the next RoleFlow", paragraphs: splitParas(fill(v.body, "three minutes", v.time)), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "referral-ask",
    name: "Referral request",
    category: "Growth",
    description: "Ask happy users to tell a friend or community.",
    fields: [body("If RoleFlow has made your hiring easier, would you tell another community about it?\n\nEvery referral helps us keep the platform independent and growing."), ...ctaFields("Share RoleFlow", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: "Know another community that could use RoleFlow?", heading: "Share the love", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "tips-how-to",
    name: "Tips and how-to",
    category: "Product",
    description: "Practical tips to get more from the platform.",
    fields: [text("topic", "Topic", "Writing applications people finish", { required: true }), body("Here are a few ways to get more from your applications.\n\nSmall changes to your questions make a big difference."), bullets("Keep questions short and specific\nAsk for examples, not opinions\nSet a clear deadline on every position"), ...ctaFields("Read the guide", `${DEFAULT_ORIGIN}/docs`)],
    build: (v) => ({ subject: `Tip: ${v.topic}`, heading: v.topic, paragraphs: splitParas(v.body), bullets: splitLines(v.bullets), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "onboarding-reminder",
    name: "Finish your setup",
    category: "Growth",
    description: "Nudge people who have not finished setting up.",
    fields: [body("You started setting up RoleFlow but have not finished yet.\n\nIt only takes a few minutes to publish your first position."), ...ctaFields("Finish setup", `${DEFAULT_ORIGIN}/dashboard`)],
    build: (v) => ({ subject: "Almost there, finish your RoleFlow setup", heading: "Pick up where you left off", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "reactivation",
    name: "We miss you",
    category: "Growth",
    description: "Win back people who have not logged in for a while.",
    fields: [body("It has been a while since we last saw you on RoleFlow.\n\nA lot has changed, and we would love to show you what is new."), ...ctaFields("Come back", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: "We miss you on RoleFlow", heading: "Good to see you again", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "community-spotlight",
    name: "Community spotlight",
    category: "Community",
    description: "Feature a community that is doing great things.",
    fields: [text("community", "Community name", "Your community", { required: true }), body("We wanted to highlight {COMMUNITY}, which has been doing excellent work with RoleFlow.\n\nThanks for setting the standard for everyone else."), ...ctaFields("Visit the community", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `Spotlight: ${v.community}`, heading: `Spotlight on ${v.community}`, paragraphs: splitParas(fill(v.body, "{COMMUNITY}", v.community)), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "community-milestone",
    name: "Milestone thank-you",
    category: "Community",
    description: "Celebrate a platform milestone with everyone.",
    fields: [text("milestone", "Milestone", "10,000 applications reviewed", { required: true }), body("We hit a milestone together: {MILESTONE}.\n\nThank you for trusting RoleFlow with your community."), ...ctaFields("Read more", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `We did it: ${v.milestone}`, heading: "A milestone worth celebrating", paragraphs: splitParas(fill(v.body, "{MILESTONE}", v.milestone)), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "event-invite",
    name: "Event invitation",
    category: "Community",
    description: "Invite people to a live event or webinar.",
    fields: [text("event", "Event name", "RoleFlow community office hours", { required: true }), text("when", "Date and time", "Thursday at 7 PM ET", { required: true }), body("Join us for {EVENT} on {WHEN}.\n\nBring your questions. We will cover new features and answer what you ask."), ...ctaFields("Save my spot", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `Join us: ${v.event}`, heading: v.event, paragraphs: splitParas(v.body.split("{EVENT}").join(v.event).split("{WHEN}").join(v.when)), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "maintenance-window",
    name: "Scheduled maintenance",
    category: "Operations",
    description: "Warn people about planned downtime.",
    fields: [text("window", "Window (with time zone)", "Sunday 2 AM to 3 AM ET", { required: true }), body("We will perform planned maintenance during the window above.\n\nThe site may be briefly unavailable. Your data is safe, and applications can still be saved as drafts."), ...ctaFields("Status page", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `Scheduled maintenance: ${v.window}`, heading: "Planned maintenance", paragraphs: [...splitParas(v.body), `Window: ${v.window}.`], cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "incident-resolved",
    name: "Incident resolved",
    category: "Operations",
    description: "Apologize and explain after an outage is fixed.",
    fields: [text("duration", "How long it lasted", "about 40 minutes", { required: true }), body("Between earlier today and now, parts of RoleFlow were unavailable for {DURATION}.\n\nThe issue is resolved. We are sorry for the disruption, and we are reviewing what happened so it does not happen again."), ...ctaFields("View status", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: "Resolved: service disruption", heading: "The issue is resolved", paragraphs: splitParas(fill(v.body, "{DURATION}", v.duration)), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "security-advisory",
    name: "Security advisory",
    category: "Security",
    description: "Ask people to take a security step, such as turning on two-factor sign-in.",
    fields: [body("As a precaution, we recommend that you review your account security.\n\nIf you did not request any changes recently, you can ignore this message. Turn on two-factor sign-in for extra protection."), ...ctaFields("Review security settings", `${DEFAULT_ORIGIN}/settings`)],
    build: (v) => ({ subject: "Action recommended: review your account security", heading: "Please review your account security", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "thank-you",
    name: "Thank you",
    category: "Community",
    description: "A plain, personal thank-you.",
    fields: [body("Thank you for being part of RoleFlow.\n\nYour feedback and patience help us build something better every week."), ...ctaFields("Open RoleFlow", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: "Thank you", heading: "Thank you", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "holiday-greeting",
    name: "Holiday greeting",
    category: "Seasonal",
    description: "Seasonal good wishes, with an optional note on support hours.",
    fields: [text("holiday", "Holiday or season", "the holidays", { required: true }), body("Wishing you a relaxed and happy {HOLIDAY}.\n\nOur support team will be running on reduced hours. We will get back to you as soon as we can."), ...ctaFields("Open RoleFlow", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `Happy ${v.holiday} from RoleFlow`, heading: `Happy ${v.holiday}`, paragraphs: splitParas(fill(v.body, "{HOLIDAY}", v.holiday)), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "new-year",
    name: "New year kickoff",
    category: "Seasonal",
    description: "Start the year with what is planned.",
    fields: [text("year", "Year", "2027", { required: true }), body("A new year is a good time to set up your hiring for the months ahead.\n\nHere is what we are planning for {YEAR}."), bullets("Better analytics for every community\nFaster application review\nMore ways to customize your site"), ...ctaFields("See the roadmap", DEFAULT_ORIGIN)],
    build: (v) => ({ subject: `Our plans for ${v.year}`, heading: `Welcome to ${v.year}`, paragraphs: splitParas(fill(v.body, "{YEAR}", v.year)), bullets: splitLines(v.bullets), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "data-breach-notice",
    name: "Data breach notice",
    category: "Security",
    description: "Tell people a security incident may have exposed their data, what happened, and what to do.",
    fields: [
      text("incidentDate", "When it was discovered", "on October 29", { required: true }),
      text("dataTypes", "Information that may be affected", "email addresses and hashed passwords", { required: true, maxLength: 300 }),
      body("We recently discovered unauthorized access to part of the RoleFlow system. We detected it on {DATE} and closed the access the same day.\n\nThe information that may have been affected is: {DATA}. Passwords are stored in a form that cannot be read directly, but we are asking everyone to change theirs as a precaution.\n\nWe are working with security specialists and will tell you if we learn anything that changes this notice.", "What happened (use {DATE} and {DATA} to insert the fields above)"),
      ...ctaFields("Reset my password", `${DEFAULT_ORIGIN}/auth/forgot-password`),
    ],
    build: (v) => ({
      subject: "Important: a security incident involving your RoleFlow data",
      heading: "A security incident involving your data",
      paragraphs: splitParas(fill(fill(v.body, "{DATE}", v.incidentDate), "{DATA}", v.dataTypes)),
      bullets: ["Change your RoleFlow password, and any other account where you reuse it", "Turn on two-factor sign-in in Settings", "Be cautious of unexpected emails asking for passwords or payments"],
      cta: { label: v.ctaLabel, url: v.ctaUrl },
    }),
  },
  {
    id: "breach-followup",
    name: "Breach follow-up",
    category: "Security",
    description: "A follow-up after a breach notice with the outcome and any new steps.",
    fields: [
      body("Last week we told you about a security incident. Here is where things stand.\n\nWe have finished our investigation. We found no evidence that anything beyond what we described was accessed. We have also added protections so this kind of access is detected faster.\n\nThank you for your patience. If you have questions, reply to this email."),
      ...ctaFields("Read the full update", `${DEFAULT_ORIGIN}/privacy`),
    ],
    build: (v) => ({ subject: "Update on the security incident", heading: "Our investigation is complete", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "incident-update",
    name: "Incident status update",
    category: "Security",
    description: "A live status update while an incident is still being handled.",
    fields: [
      text("status", "Current status", "Investigating", { required: true }),
      body("We are currently investigating an issue that may affect some RoleFlow features.\n\nAt this time there is no sign that personal information was accessed. We will send another update when we have more to share."),
      ...ctaFields("View status page", DEFAULT_ORIGIN),
    ],
    build: (v) => ({ subject: `Security update: ${v.status}`, heading: `Status: ${v.status}`, paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
  },
  {
    id: "password-reset-required",
    name: "Password reset required",
    category: "Security",
    description: "Ask every affected user to set a new password.",
    fields: [
      body("To keep your account safe, please set a new password for RoleFlow.\n\nYour current password will stop working once you request a reset. If you already changed it recently, you can ignore this message."),
      ...ctaFields("Set a new password", `${DEFAULT_ORIGIN}/auth/forgot-password`),
    ],
    build: (v) => ({ subject: "Please reset your RoleFlow password", heading: "Please reset your password", paragraphs: splitParas(v.body), cta: { label: v.ctaLabel, url: v.ctaUrl } }),
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

/** Only https links, or links on RoleFlow's own origin. Blocks javascript:, data:, and http. */
export function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.username === "" && u.password === "";
  } catch {
    return false;
  }
}

/** Replaces every occurrence of a literal token. Uses split/join so "$" in user text is never treated as a pattern. */
function fill(s: string, token: string, value: string): string {
  return s.split(token).join(value);
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

/** Full render: subject, HTML, and plain text. Same output on the preview and on the live send. */
export function renderEmail(
  tpl: Template,
  raw: Record<string, unknown>,
  recipientName: string | null | undefined,
  opts: { unsubscribeUrl?: string } = {}
): RenderedEmail {
  const v = normalizeValues(tpl, raw);
  const b = tpl.build(v);
  if (b.cta && !isSafeUrl(b.cta.url)) throw new TemplateInputError("The button link must be https://.");

  const name = (recipientName ?? "").trim();
  const greet = name ? `Hi ${name},` : "Hi there,";
  const subject = b.subject.replace(/[\r\n]+/g, " ").slice(0, 150);

  const paras = b.paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.55;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
  const list = b.bullets && b.bullets.length
    ? `<ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">${b.bullets.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
    : "";
  const cta = b.cta
    ? `<p style="margin:22px 0;"><a href="${escapeHtml(b.cta.url)}" style="display:inline-block;background:#e5532d;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">${escapeHtml(b.cta.label)}</a></p>`
    : "";

  const footerLinkHtml = opts.unsubscribeUrl
    ? ` <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#6b665c;">Unsubscribe from these emails</a>.`
    : " You can turn off these emails in Settings.";
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#161512;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
    <p style="margin:0 0 14px;">${escapeHtml(greet)}</p>
    <h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(b.heading)}</h1>
    ${paras}
    ${list}
    ${cta}
    <p style="margin:28px 0 0;font-size:12px;color:#6b665c;border-top:1px solid #eee;padding-top:14px;">You are receiving this because you have a RoleFlow account or a verified company address linked to one.${footerLinkHtml}</p>
  </div></body></html>`;

  const text = [
    greet,
    "",
    b.heading,
    "",
    ...b.paragraphs.map((p) => p + "\n"),
    ...(b.bullets ?? []).map((x) => `  - ${x}`),
    ...(b.cta ? ["", `${b.cta.label}: ${b.cta.url}`] : []),
    "",
    "You are receiving this because you have a RoleFlow account or a verified company address linked to one." +
      (opts.unsubscribeUrl ? ` Unsubscribe from these emails: ${opts.unsubscribeUrl}` : " You can turn off these emails in Settings."),
  ].join("\n");

  return { subject, html, text };
}
