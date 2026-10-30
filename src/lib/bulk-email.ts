import { Resend } from "resend";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { getTemplate, normalizeValues, renderEmail, TemplateInputError, type RenderedEmail } from "./email-templates";
import { optedOutSet, unsubscribeUrl } from "./unsubscribe";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RoleFlow <onboarding@resend.dev>";
const RESEND_BATCH = 100; // Resend's batch endpoint accepts up to 100 messages per call
export const LIVE_BATCH_LIMIT = 500; // one founder click sends at most this many
const LOCK_MS = 5 * 60_000;

export class BulkError extends Error {}

type Recipient = { userId: string; name: string; email: string };

function resendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new BulkError("RESEND_API_KEY is not set on the server.");
  return new Resend(key);
}

/** Account addresses that may receive bulk email: an address, email notifications on, not removed, not banned. */
const ACCOUNT_WHERE = {
  email: { not: null },
  emailRemovedAt: null,
  emailNotifications: true,
  isBanned: false,
} as const;

/** Verified company addresses. Bans still apply. Company addresses have no separate notification switch. */
const COMPANY_WHERE = {
  companyEmail: { not: null },
  companyEmailVerifiedAt: { not: null },
  isBanned: false,
} as const;

/** How many addresses are eligible right now, before opt-outs and de-duplication. */
export async function eligibleCount(): Promise<number> {
  const [accounts, companies] = await Promise.all([
    prisma.user.count({ where: ACCOUNT_WHERE }),
    prisma.user.count({ where: COMPANY_WHERE }),
  ]);
  return accounts + companies;
}

/** Eligible addresses that this campaign has not sent to yet. Each address appears once. */
export async function remainingRecipients(campaignId: string): Promise<Recipient[]> {
  const [accounts, companies, sent, optedOut] = await Promise.all([
    prisma.user.findMany({
      where: ACCOUNT_WHERE,
      select: { id: true, username: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: COMPANY_WHERE,
      select: { id: true, username: true, companyEmail: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bulkCampaignSend.findMany({ where: { campaignId }, select: { email: true } }),
    optedOutSet(),
  ]);
  // Each address once, even when an account and a company address match. Sent and opted-out addresses are skipped.
  const seen = new Set<string>([...sent.map((s) => s.email.toLowerCase()), ...optedOut]);
  const out: Recipient[] = [];
  const add = (userId: string, name: string, raw: string | null) => {
    const email = (raw ?? "").trim();
    if (!email) return;
    const key = email.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ userId, name, email });
  };
  for (const u of accounts) add(u.id, u.username, u.email);
  for (const c of companies) add(c.id, c.username, c.companyEmail);
  return out;
}

/** Validates the template and values, then stores a draft campaign. Nothing is sent here. */
export async function createCampaign(input: {
  name: string;
  templateId: string;
  values: Record<string, unknown>;
  createdById: string;
}) {
  const tpl = getTemplate(input.templateId);
  if (!tpl) throw new TemplateInputError("Unknown template.");
  const name = input.name.trim().slice(0, 120);
  if (!name) throw new TemplateInputError("Give the campaign a name.");
  const values = normalizeValues(tpl, input.values);
  // Render once so a broken value fails here, not halfway through a send.
  renderEmail(tpl, values, "Preview");

  return prisma.bulkCampaign.create({
    data: { name, templateId: tpl.id, values: JSON.stringify(values), createdById: input.createdById },
  });
}

function renderFor(campaign: { templateId: string; values: string }, recipientName: string | null, email: string): RenderedEmail {
  const tpl = getTemplate(campaign.templateId);
  if (!tpl) throw new BulkError("This campaign uses a template that no longer exists.");
  let values: Record<string, unknown> = {};
  try {
    values = JSON.parse(campaign.values);
  } catch {
    throw new BulkError("This campaign's content is damaged and cannot be sent.");
  }
  return renderEmail(tpl, values, recipientName, { unsubscribeUrl: unsubscribeUrl(email) });
}

/** Headers that let mail clients show a native unsubscribe button (RFC 8058 one-click). */
function listHeaders(email: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** Sends one test copy to the founder's own address. Not recorded as a campaign send. */
export async function sendTest(input: { templateId: string; values: Record<string, unknown>; to: string; name: string | null }) {
  const tpl = getTemplate(input.templateId);
  if (!tpl) throw new TemplateInputError("Unknown template.");
  const m = renderEmail(tpl, input.values, input.name, { unsubscribeUrl: unsubscribeUrl(input.to) });
  const { data, error } = await resendClient().emails.send({
    from: FROM_EMAIL,
    to: [input.to],
    subject: `[TEST] ${m.subject}`,
    html: m.html,
    text: m.text,
    headers: listHeaders(input.to),
  });
  if (error || !data) throw new BulkError("The test email could not be sent. Check the sending settings.");
  return { sent: true };
}

/**
 * Sends the next batch (up to LIVE_BATCH_LIMIT) for a campaign. Call again to continue.
 * A short lease stops two requests from sending the same batch at once.
 */
export async function sendNextBatch(campaignId: string) {
  const now = new Date();
  const lock = await prisma.bulkCampaign.updateMany({
    where: {
      id: campaignId,
      status: { in: ["DRAFT", "SENDING"] },
      OR: [{ sendLockedUntil: null }, { sendLockedUntil: { lt: now } }],
    },
    data: { status: "SENDING", sendLockedUntil: new Date(now.getTime() + LOCK_MS) },
  });
  if (lock.count === 0) {
    const current = await prisma.bulkCampaign.findUnique({ where: { id: campaignId }, select: { status: true } });
    if (!current) throw new BulkError("Campaign not found.");
    throw new BulkError(current.status === "COMPLETE" ? "This campaign is already complete." : "A batch for this campaign is already sending. Wait a moment and check progress.");
  }

  let sent = 0;
  let failed = 0;
  try {
    const campaign = await prisma.bulkCampaign.findUniqueOrThrow({ where: { id: campaignId } });
    const recipients = (await remainingRecipients(campaignId)).slice(0, LIVE_BATCH_LIMIT);
    const resend = resendClient();

    for (let i = 0; i < recipients.length; i += RESEND_BATCH) {
      const chunk = recipients.slice(i, i + RESEND_BATCH);
      const messages = chunk.map((r) => {
        const m = renderFor(campaign, r.name, r.email);
        return { from: FROM_EMAIL, to: [r.email], subject: m.subject, html: m.html, text: m.text, headers: listHeaders(r.email) };
      });

      const { data, error } = await resend.batch.send(messages);
      if (error || !data) {
        failed += chunk.length;
        logger.error("Bulk email batch failed", { error, campaignId, size: chunk.length });
        continue;
      }
      const ids: { id: string }[] = Array.isArray((data as any).data) ? (data as any).data : [];
      await prisma.bulkCampaignSend.createMany({
        data: chunk.map((r, idx) => ({ campaignId, email: r.email, userId: r.userId, resendId: ids[idx]?.id ?? null })),
        skipDuplicates: true,
      });
      sent += chunk.length;
    }
  } finally {
    const remaining = (await remainingRecipients(campaignId)).length;
    await prisma.bulkCampaign.update({
      where: { id: campaignId },
      data: {
        status: remaining === 0 ? "COMPLETE" : "SENDING",
        totalSent: { increment: sent },
        totalFailed: { increment: failed },
        sendLockedUntil: null,
      },
    });
  }

  const after = await prisma.bulkCampaign.findUniqueOrThrow({ where: { id: campaignId }, select: { status: true, totalSent: true, totalFailed: true } });
  const remaining = (await remainingRecipients(campaignId)).length;
  return { sent, failed, remaining, status: after.status, totalSent: after.totalSent, totalFailed: after.totalFailed };
}

/** Deletes a campaign that has never sent anything. */
export async function discardDraft(campaignId: string) {
  const c = await prisma.bulkCampaign.findUnique({ where: { id: campaignId }, select: { status: true, totalSent: true } });
  if (!c) throw new BulkError("Campaign not found.");
  if (c.status !== "DRAFT" || c.totalSent > 0) throw new BulkError("Only drafts that have not sent anything can be discarded.");
  await prisma.bulkCampaign.delete({ where: { id: campaignId } });
}
