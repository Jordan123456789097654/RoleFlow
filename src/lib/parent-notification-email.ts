export type StaffNotificationInput = {
  kind: "contact" | "idea";
  name: string | null;
  email: string;
  message: string;
  interest?: string | null;
  submissionId: string;
  submittedAt: Date;
};

export type StaffNotification = { subject: string; text: string; html: string };

const KIND_LABEL: Record<StaffNotificationInput["kind"], string> = {
  contact: "Contact message",
  idea: "Product suggestion",
};

const INTEREST_LABEL: Record<string, string> = {
  roster: "Roster by RoleFlow",
  applyhub: "ApplyHub by RoleFlow",
};

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Time in New York, the time zone the staff team works in. */
export function formatEastern(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

/** Builds the staff notification for a contact or suggestion form submission. */
export function buildStaffNotification(input: StaffNotificationInput): StaffNotification {
  const who = input.name?.trim() || input.email;
  const label = KIND_LABEL[input.kind];
  const submitted = formatEastern(input.submittedAt);
  const message = input.message?.trim() || "(No message was written.)";
  const interest = input.interest ? INTEREST_LABEL[input.interest] || input.interest : null;

  const subject =
    input.kind === "idea"
      ? `[RoleFlow Product Suggestion] from ${who}`
      : `[RoleFlow Contact Inquiry] from ${who}`;

  const textLines = [
    `${label} received on roleflow.site`,
    "",
    "Sender",
    `  Name: ${input.name?.trim() || "Not given"}`,
    `  Email: ${input.email}`,
    `  Submitted: ${submitted}`,
    `  Submission ID: ${input.submissionId}`,
  ];
  if (interest) textLines.push(`  Interested in: ${interest}`);
  textLines.push(
    "",
    "Message",
    "-------",
    message,
    "-------",
    "",
    "Next steps",
    `  - Reply to this email to answer ${input.email} directly. Replies go to the sender.`,
    "  - Record any follow-up in your support notes before closing the message.",
  );
  const text = textLines.join("\n") + "\n";

  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${escape(k)}</td><td style="padding:6px 0;color:#111827">${escape(v)}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#111827">
<div style="max-width:640px;margin:0 auto;padding:24px">
  <div style="background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7c3aed">${escape(label)} on roleflow.site</p>
    <h1 style="margin:0 0 20px;font-size:20px">${escape(who)}</h1>
    <table role="presentation" style="border-collapse:collapse;font-size:14px">
      ${row("Name", input.name?.trim() || "Not given")}
      ${row("Email", input.email)}
      ${row("Submitted", submitted)}
      ${row("Submission ID", input.submissionId)}
      ${interest ? row("Interested in", interest) : ""}
    </table>
    <h2 style="margin:24px 0 8px;font-size:14px;color:#374151">Message</h2>
    <div style="background:#f9fafb;border-left:3px solid #7c3aed;border-radius:6px;padding:14px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap">${escape(message)}</div>
    <h2 style="margin:24px 0 8px;font-size:14px;color:#374151">Next steps</h2>
    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#374151">
      <li>Reply to this email to answer ${escape(input.email)} directly. Replies go to the sender.</li>
      <li>Record any follow-up in your support notes before closing the message.</li>
    </ul>
  </div>
  <p style="margin:16px 0 0;font-size:12px;color:#6b7280;text-align:center">Sent automatically from roleflow.site.</p>
</div>
</body></html>`;

  return { subject, text, html };
}
