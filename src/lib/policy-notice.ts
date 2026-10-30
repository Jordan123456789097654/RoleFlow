import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import { platformOrigin } from "@/lib/platform-origin";
import { POLICY_SLUGS } from "@/lib/policies";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RoleFlow <onboarding@resend.dev>";
const BATCH_SIZE = 100; // Resend's batch endpoint accepts up to 100 messages per call

const POLICY_LABELS: Record<string, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  "acceptable-use": "Acceptable Use Policy",
  "community-guidelines": "Community Guidelines",
  cookies: "Cookie Policy",
};

export type Recipient = { userId: string | null; email: string; name: string };

/**
 * Every address that should receive the notice and has not been sent it yet.
 * Account addresses need notifications on, no removal, and no ban. Verified company addresses need no ban.
 * Each address appears once.
 */
export async function findRecipients(noticeId: string): Promise<Recipient[]> {
  const [accounts, companies, sent] = await Promise.all([
    prisma.user.findMany({
      where: { email: { not: null }, emailRemovedAt: null, emailNotifications: true, isBanned: false },
      select: { id: true, username: true, email: true },
    }),
    prisma.user.findMany({
      where: { companyEmail: { not: null }, companyEmailVerifiedAt: { not: null }, isBanned: false },
      select: { id: true, username: true, companyEmail: true },
    }),
    prisma.policyNoticeLog.findMany({ where: { noticeId }, select: { email: true } }),
  ]);

  const seen = new Set(sent.map((r) => r.email.toLowerCase()));
  const out: Recipient[] = [];
  const add = (userId: string, name: string, raw: string | null) => {
    const email = (raw ?? "").trim();
    if (!email) return;
    const key = email.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ userId, email, name });
  };
  for (const a of accounts) add(a.id, a.username, a.email);
  for (const c of companies) add(c.id, c.username, c.companyEmail);
  return out;
}

export async function noticeProgress(noticeId: string) {
  const [sent, remaining] = await Promise.all([
    prisma.policyNoticeLog.count({ where: { noticeId } }),
    findRecipients(noticeId).then((r) => r.length),
  ]);
  return { sent, remaining };
}

function buildEmail(r: Recipient, summary: string, updatedOn: string) {
  const base = platformOrigin();
  const subject = "Updates to RoleFlow's policies";
  const greeting = r.name ? `Hi ${escapeHtml(r.name)},` : "Hi,";
  const summaryHtml = summary.split(/\n\s*\n/).map((p) => `<p>${escapeHtml(p.trim())}</p>`).join("");
  const linksHtml = POLICY_SLUGS.map((slug) => `<li><a href="${base}/${slug}">${escapeHtml(POLICY_LABELS[slug] ?? slug)}</a></li>`).join("");
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#161512;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
    <p>${greeting}</p>
    <p>We have updated the policies on RoleFlow. These changes took effect on <strong>${escapeHtml(updatedOn)}</strong>.</p>
    ${summaryHtml}
    <p>The updated policies:</p>
    <ul>${linksHtml}</ul>
    <p style="font-size:12px;color:#6b665c;">You are receiving this because you have a RoleFlow account, or a verified company email linked to one. You can manage email notifications in Settings.</p>
  </div></body></html>`;
  const text = [
    r.name ? `Hi ${r.name},` : "Hi,",
    "",
    `We have updated the policies on RoleFlow. These changes took effect on ${updatedOn}.`,
    "",
    summary,
    "",
    "The updated policies:",
    ...POLICY_SLUGS.map((slug) => `  - ${POLICY_LABELS[slug] ?? slug}: ${base}/${slug}`),
    "",
    "You are receiving this because you have a RoleFlow account, or a verified company email linked to one. You can manage email notifications in Settings.",
  ].join("\n");
  return { subject, html, text };
}

/**
 * Sends the notice to up to `limit` unsent addresses. Call again to continue; addresses already sent are skipped.
 * Only the founder route calls this.
 */
export async function sendPolicyNotice(opts: { noticeId: string; summary: string; updatedOn: string; limit: number }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set on the server.");
  const resend = new Resend(apiKey);

  const recipients = (await findRecipients(opts.noticeId)).slice(0, opts.limit);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((r) => {
      const m = buildEmail(r, opts.summary, opts.updatedOn);
      return { from: FROM_EMAIL, to: [r.email], subject: m.subject, html: m.html, text: m.text };
    });

    const { data, error } = await resend.batch.send(messages);
    if (error || !data) {
      failed += chunk.length;
      logger.error("Policy notice batch failed", { error, noticeId: opts.noticeId, size: chunk.length });
      continue;
    }

    const ids: { id: string }[] = Array.isArray((data as any).data) ? (data as any).data : [];
    await prisma.policyNoticeLog.createMany({
      data: chunk.map((r, idx) => ({
        noticeId: opts.noticeId,
        email: r.email,
        userId: r.userId,
        resendId: ids[idx]?.id ?? null,
      })),
      skipDuplicates: true,
    });
    sent += chunk.length;
  }

  const progress = await noticeProgress(opts.noticeId);
  return { sent, failed, ...progress };
}
