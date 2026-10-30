/**
 * Report templates that support staff fill in on the website after handling a Discord ticket.
 * The website does not receive tickets; staff type the ticket reference from the Discord bot.
 */

export type FieldKind = "text" | "textarea" | "select" | "checkbox" | "multi";
export type ReportField = { key: string; label: string; kind: FieldKind; required?: boolean; options?: string[]; help?: string };
export type ReportTemplate = {
  id: string;
  label: string;
  group: string;
  description: string;
  ticket: boolean; // requires a ticket reference
  subject: boolean; // asks which user the report is about
  fields: ReportField[];
};

const txt = (key: string, label: string, required = false, help?: string): ReportField => ({ key, label, kind: "text", required, help });
const area = (key: string, label: string, required = false, help?: string): ReportField => ({ key, label, kind: "textarea", required, help });
const sel = (key: string, label: string, options: string[], required = false): ReportField => ({ key, label, kind: "select", options, required });
const chk = (key: string, label: string, required = false): ReportField => ({ key, label, kind: "checkbox", required });
const multi = (key: string, label: string, options: string[], required = false): ReportField => ({ key, label, kind: "multi", options, required });

const YES_NO_PARTIAL = ["YES", "NO", "PARTIAL"];
const DATA_ITEMS = ["email", "companyEmail", "robloxLink", "savedProfile", "applicationDrafts", "loginDevices", "applicationMessages"];
const VERIFY = ["SIGNED_IN_SESSION", "SUPPORT_CODE", "DISCORD_DM_CONFIRMATION", "OTHER"];

function t(id: string, label: string, group: string, description: string, opts: { ticket?: boolean; subject?: boolean }, fields: ReportField[]): ReportTemplate {
  return { id, label, group, description, ticket: !!opts.ticket, subject: !!opts.subject, fields };
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // Tickets
  t("TICKET_RESOLUTION", "Ticket resolved", "Tickets", "Required after every ticket you close in Discord.", { ticket: true, subject: true }, [
    sel("outcome", "Outcome", ["RESOLVED", "NO_ACTION", "ESCALATED", "WAITING_ON_USER", "USER_UNRESPONSIVE"], true),
    area("actionsTaken", "What you did", true),
    sel("userSatisfied", "Did the user confirm the issue is fixed?", ["YES", "NO", "UNKNOWN"]),
    txt("minutesSpent", "Approximate minutes spent"),
  ]),
  t("TICKET_ESCALATED", "Ticket escalated", "Tickets", "The ticket was passed to an admin, the founder, legal, or a developer.", { ticket: true, subject: true }, [
    sel("escalatedTo", "Escalated to", ["ADMIN", "FOUNDER", "LEGAL", "DEVELOPER"], true),
    area("reason", "Why it was escalated", true),
    sel("urgency", "Urgency", ["LOW", "NORMAL", "HIGH", "URGENT"], true),
  ]),
  t("TICKET_NO_RESPONSE", "User did not respond", "Tickets", "The user stopped replying before the issue was resolved.", { ticket: true, subject: true }, [
    txt("attempts", "How many times you followed up", true),
    txt("lastContact", "Date and time of last contact"),
    area("closeNote", "Closing note sent to the user"),
  ]),
  t("TICKET_DUPLICATE", "Duplicate ticket", "Tickets", "The same issue already has another ticket open.", { ticket: true }, [
    txt("duplicateOf", "Reference of the original ticket", true),
  ]),
  t("TICKET_SPAM", "Spam or abuse ticket", "Tickets", "A ticket opened to spam, troll, or attempt a scam.", { ticket: true, subject: true }, [
    sel("kind", "Kind", ["SPAM", "TROLLING", "HARASSMENT", "SCAM_ATTEMPT"], true),
    area("actionsTaken", "Action taken", true),
  ]),

  // Data
  t("DATA_REMOVAL", "Data removal", "Data", "Log every piece of personal data removed for a user.", { ticket: true, subject: true }, [
    multi("items", "What was removed", DATA_ITEMS, true),
    sel("requestedBy", "Who asked for the removal", ["USER", "COMMUNITY_OWNER", "LEGAL_REQUEST", "SUPPORT_INITIATED"], true),
    chk("identityVerified", "Identity was verified before removal", true),
    sel("verificationMethod", "How identity was verified", VERIFY, true),
    sel("confirmedWithUser", "Confirmed the removal with the user", ["YES", "NO"], true),
    area("reason", "Reason and context", true),
  ]),
  t("DATA_EXPORT", "Data export sent", "Data", "A user asked for a copy of their data.", { ticket: true, subject: true }, [
    chk("identityVerified", "Identity was verified", true),
    sel("deliveryMethod", "How it was sent", ["DOWNLOAD_INSTRUCTIONS", "EMAIL", "OTHER"], true),
    area("notes", "Notes"),
  ]),
  t("DATA_DELETION_REQUEST", "Account deletion request", "Data", "A user asked to delete their whole account.", { ticket: true, subject: true }, [
    chk("identityVerified", "Identity was verified", true),
    sel("ownedCommunities", "Communities the user owns", ["NONE", "TRANSFERRED", "DELETED", "STILL_OWNED"], true),
    sel("outcome", "Outcome", ["DELETED", "BLOCKED_OWNS_COMMUNITY", "DECLINED", "PENDING"], true),
    area("notes", "Notes"),
  ]),
  t("DATA_CORRECTION", "Data correction", "Data", "A user asked us to fix information they cannot edit themselves.", { ticket: true, subject: true }, [
    txt("field", "Which field", true),
    txt("correctedValue", "New value"),
    chk("identityVerified", "Identity was verified", true),
  ]),
  t("MINOR_DATA_CONCERN", "Possible minor's data", "Data", "Information suggests the account may belong to someone under the minimum age.", { ticket: false, subject: true }, [
    sel("source", "How it came to light", ["USER_REPORT", "STAFF_OBSERVATION", "OWNER_REPORT", "OTHER"], true),
    area("actionsTaken", "Action taken", true),
    chk("escalated", "Escalated to admin", true),
  ]),

  // Accounts
  t("ACCOUNT_ACCESS", "Account access issue", "Accounts", "A user could not sign in or lost their session.", { ticket: true, subject: true }, [
    sel("issue", "Issue", ["DISCORD_LOGIN", "EMAIL_LOGIN", "SESSION_EXPIRED", "LOCKED_OUT", "WRONG_ACCOUNT", "OTHER"], true),
    area("actionsTaken", "Actions taken", true),
    sel("resolved", "Resolved", YES_NO_PARTIAL, true),
  ]),
  t("PASSWORD_RESET_ASSIST", "Password reset assisted", "Accounts", "You helped a user through a password reset.", { ticket: true, subject: true }, [
    sel("method", "Method", ["EMAIL_LINK", "SUPPORT_CODE"], true),
    chk("identityVerified", "Identity was verified", true),
    area("notes", "Notes"),
  ]),
  t("SESSIONS_REVOKED", "Sessions revoked", "Accounts", "All of a user's sessions were signed out.", { ticket: true, subject: true }, [
    area("reason", "Reason", true),
    chk("devicesRemoved", "Recorded devices were also removed"),
  ]),
  t("TWO_FACTOR_RESET", "Two-factor reset", "Accounts", "Two-factor authentication was reset for an admin account.", { ticket: true, subject: true }, [
    chk("identityVerified", "Identity was verified", true),
    sel("recoveryUsed", "Recovery method", ["RECOVERY_CODE", "NONE_AVAILABLE", "OTHER"], true),
    area("reason", "Reason", true),
    chk("escalatedToAdmin", "Approved by an admin"),
  ]),
  t("BAN_INQUIRY", "Ban or suspension inquiry", "Accounts", "A user asked about a ban or suspension.", { ticket: true, subject: true }, [
    txt("punishmentRef", "Punishment reference"),
    chk("explained", "Reason was explained to the user", true),
    sel("appealRecommended", "Appeal recommended", ["YES", "NO", "ESCALATE"], true),
    area("notes", "Notes"),
  ]),
  t("APPEAL_HANDLED", "Appeal handled", "Accounts", "You reviewed a submitted appeal.", { subject: true }, [
    txt("punishmentRef", "Punishment reference", true),
    sel("decision", "Decision", ["UPHELD", "OVERTURNED", "PARTIAL"], true),
    area("reason", "Reason for the decision", true),
  ]),
  t("ACCOUNT_COMPROMISE", "Suspected account compromise", "Accounts", "Signs that someone else is using an account.", { ticket: true, subject: true }, [
    area("indicators", "What made you suspect compromise", true),
    area("actionsTaken", "Actions taken", true),
    sel("severity", "Severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"], true),
  ]),

  // Applications and communities
  t("APPLICATION_ISSUE", "Application issue", "Applications", "An application is missing, stuck, or wrong.", { ticket: true, subject: true }, [
    txt("applicationRef", "Application reference"),
    sel("issue", "Issue", ["NOT_RECEIVED", "WRONG_STATUS", "DUPLICATE", "WITHDRAWN_BY_ERROR", "MISSING_ANSWERS", "OTHER"], true),
    area("actionsTaken", "Actions taken", true),
  ]),
  t("ROBLOX_LINK_ISSUE", "Roblox link issue", "Applications", "Problems linking or verifying a Roblox account.", { ticket: true, subject: true }, [
    sel("issue", "Issue", ["WRONG_ACCOUNT", "CANNOT_LINK", "VERIFICATION_FAILED", "REMOVED_BY_USER", "OTHER"], true),
    area("actionsTaken", "Actions taken", true),
  ]),
  t("COMMUNITY_ACCESS", "Community access issue", "Applications", "Owner or staff access, domains, or bot setup.", { ticket: true }, [
    txt("communityRef", "Community name or ID", true),
    sel("issue", "Issue", ["OWNER_TRANSFER", "STAFF_ACCESS", "CUSTOM_DOMAIN", "BOT_SETUP", "LICENSE", "OTHER"], true),
    area("actionsTaken", "Actions taken", true),
  ]),
  t("BILLING_LICENSE", "Billing or license issue", "Applications", "Refunds, license keys, plan changes, or chargebacks.", { ticket: true, subject: true }, [
    sel("issue", "Issue", ["REFUND_REQUEST", "LICENSE_NOT_APPLIED", "PLAN_CHANGE", "CHARGEBACK", "OTHER"], true),
    txt("amount", "Amount, if relevant"),
    area("actionsTaken", "Actions taken", true),
  ]),

  // Safety and platform
  t("SAFETY_REPORT", "Safety or harassment", "Safety", "Harassment, threats, scams, or impersonation.", { ticket: true, subject: true }, [
    sel("category", "Category", ["HARASSMENT", "SCAM", "IMPERSONATION", "THREAT", "EXPLOITATION", "OTHER"], true),
    sel("severity", "Severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"], true),
    area("evidence", "Evidence and where it was seen", true),
    area("actionsTaken", "Actions taken", true),
  ]),
  t("SCAM_OR_PHISHING", "Scam or phishing link", "Safety", "A link or request that tries to steal accounts or money.", { ticket: true }, [
    txt("link", "Link or domain", true),
    sel("reportedBy", "Who reported it", ["USER", "STAFF", "MODERATOR", "OWNER"], true),
    area("actionsTaken", "Actions taken", true),
  ]),
  t("PLATFORM_BUG", "Platform bug", "Platform", "Something on the website does not work as expected.", { ticket: false }, [
    sel("area", "Area", ["SIGNIN", "APPLICATIONS", "DASHBOARD", "BOT", "CUSTOM_DOMAIN", "BILLING", "OTHER"], true),
    area("steps", "Steps to reproduce", true),
    area("expected", "What should happen"),
    area("actual", "What happened"),
    sel("reproducible", "Reproducible", ["YES", "NO", "SOMETIMES"], true),
  ]),
  t("BOT_ISSUE", "Discord bot issue", "Platform", "The bot is not behaving for a community.", { ticket: true }, [
    txt("guildRef", "Community name or ID", true),
    sel("issue", "Issue", ["NOT_RESPONDING", "WRONG_ROLE", "DM_FAILED", "INTERVIEW_CHANNEL_FAILED", "OTHER"], true),
    area("actionsTaken", "Actions taken", true),
  ]),

  // Shift and follow-up
  t("ESCALATION_FOLLOWUP", "Escalation follow-up", "Shift", "An update on a report or ticket that was escalated earlier.", { ticket: false }, [
    txt("previousReportRef", "Earlier report reference", true),
    area("update", "Update", true),
    sel("status", "Status now", ["OPEN", "RESOLVED", "CLOSED"], true),
  ]),
  t("SHIFT_SUMMARY", "End of shift summary", "Shift", "Summary of your shift.", { ticket: false }, [
    txt("ticketsHandled", "Number of tickets handled", true),
    area("openItems", "Open items for the next person"),
    area("notes", "Notes"),
  ]),
  t("GENERAL_NOTE", "General note", "Shift", "Anything else staff should know.", { ticket: false, subject: false }, [
    area("note", "Note", true),
  ]),
];

export function getTemplate(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

export type ValidatedReport = {
  reportType: string;
  ticketRef: string | null;
  subjectUsername: string | null;
  fields: Record<string, string | boolean | string[]>;
  summary: string;
};

/** Checks a submitted report against its template. Returns the cleaned answers or an error message. */
export function validateReport(tpl: ReportTemplate, body: any): ValidatedReport | string {
  const raw = (body?.fields ?? {}) as Record<string, unknown>;
  const fields: Record<string, string | boolean | string[]> = {};

  for (const f of tpl.fields) {
    const v = raw[f.key];
    if (f.kind === "checkbox") {
      const b = v === true;
      if (f.required && !b) return `"${f.label}" must be ticked.`;
      fields[f.key] = b;
    } else if (f.kind === "multi") {
      const arr = Array.isArray(v) ? v.map(String) : [];
      if (arr.some((x) => !f.options?.includes(x))) return `"${f.label}" has an invalid option.`;
      if (f.required && arr.length === 0) return `Choose at least one option for "${f.label}".`;
      fields[f.key] = arr;
    } else {
      const str = typeof v === "string" ? v.trim() : "";
      if (f.required && !str) return `"${f.label}" is required.`;
      if (str.length > 4000) return `"${f.label}" is too long (4000 characters maximum).`;
      if (f.kind === "select" && str && !f.options?.includes(str)) return `"${f.label}" has an invalid option.`;
      fields[f.key] = str;
    }
  }

  const ticketRef = typeof body?.ticketRef === "string" ? body.ticketRef.trim() : "";
  if (tpl.ticket && !ticketRef) return "Enter the Discord ticket reference for this report.";
  if (ticketRef.length > 100) return "The ticket reference is too long.";

  const subjectUsername = typeof body?.subjectUsername === "string" ? body.subjectUsername.trim() : "";
  if (tpl.subject && !subjectUsername) return "Enter the user this report is about (Discord username, Roblox username, or user ID).";
  if (subjectUsername.length > 100) return "The user reference is too long.";

  const firstText = tpl.fields.find((f) => f.kind === "textarea" && f.required);
  const summary = (firstText && typeof fields[firstText.key] === "string" ? (fields[firstText.key] as string) : tpl.label).slice(0, 200);

  return {
    reportType: tpl.id,
    ticketRef: ticketRef || null,
    subjectUsername: subjectUsername || null,
    fields,
    summary,
  };
}

/** Removal item labels used by the data removal log and the data removal report. */
export const REMOVAL_ITEM_LABELS: Record<string, string> = {
  email: "Email address",
  companyEmail: "Verified company email",
  robloxLink: "Roblox link",
  savedProfile: "Saved profile answers",
  applicationDrafts: "Server copies of drafts",
  loginDevices: "Recorded devices",
  applicationMessages: "Messages the user sent on applications",
  account: "Whole account (deleted)",
};
