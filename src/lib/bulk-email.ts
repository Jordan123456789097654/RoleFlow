import { Resend } from "resend";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { getTemplate, isTransactional, normalizeValues, renderEmail, templateAudience, TemplateInputError, type Audience, type RenderedEmail } from "./email-templates";
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

/** Staff: a verified company address AND a staff role (support, moderator, admin, or founder). Used by staff-only templates. */
const STAFF_WHERE = {
  companyEmail: { not: null },
  companyEmailVerifiedAt: { not: null },
  isBanned: false,
  OR: [
    { isSupportStaff: true },
    { isSiteAdmin: true },
    { siteRole: { in: ["FOUNDER", "ADMIN", "MODERATOR", "SUPPORT", "STAFF"] } },
  ],
};

/** How many verified staff company addresses exist right now. */
export async function staffEligibleCount(): Promise<number> {
  return prisma.user.count({ where: STAFF_WHERE });
}

/** How many addresses are eligible right now, before opt-outs and de-duplication. */
export async function eligibleCount(): Promise<number> {
  const [accounts, companies] = await Promise.all([
    prisma.user.count({ where: ACCOUNT_WHERE }),
    prisma.user.count({ where: COMPANY_WHERE }),
  ]);
  return accounts + companies;
}

/** Eligible addresses that this campaign has not sent to yet. Each address appears once. */
export type CampaignRules = { audience: Audience; ignoreOptOut: boolean };

function rulesFor(templateId: string): CampaignRules {
  const tpl = getTemplate(templateId);
  return { audience: templateAudience(tpl), ignoreOptOut: isTransactional(tpl) };
}

export async function remainingRecipients(campaignId: string, rules: CampaignRules = { audience: "all", ignoreOptOut: false }): Promise<Recipient[]> {
  const isStaff = rules.audience === "staff";
  const [accounts, companies, sent, optedOut] = await Promise.all([
    isStaff
      ? Promise.resolve([] as { id: string; username: string; email: string | null }[])
      : prisma.user.findMany({
          where: ACCOUNT_WHERE,
          select: { id: true, username: true, email: true },
          orderBy: { createdAt: "asc" },
        }),
    prisma.user.findMany({
      where: isStaff ? STAFF_WHERE : COMPANY_WHERE,
      select: { id: true, username: true, companyEmail: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bulkCampaignSend.findMany({ where: { campaignId }, select: { email: true } }),
    optedOutSet(),
  ]);
  // Each address once, even when an account and a company address match. Sent and opted-out addresses are skipped.
  const seen = new Set<string>([...sent.map((s) => s.email.toLowerCase()), ...(rules.ignoreOptOut ? [] : optedOut)]);
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

/** The audience and opt-out rules a campaign was created with, taken from its template. */
async function campaignRules(campaignId: string): Promise<CampaignRules> {
  const c = await prisma.bulkCampaign.findUnique({ where: { id: campaignId }, select: { templateId: true } });
  return c ? rulesFor(c.templateId) : { audience: "all", ignoreOptOut: false };
}

/**
 * Sends the next batch (up to LIVE_BATCH_LIMIT) for a campaign. Call again to continue.
 * Staff-only campaigns reach only verified staff company addresses.
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
    const recipients = (await remainingRecipients(campaignId, rulesFor(campaign.templateId))).slice(0, LIVE_BATCH_LIMIT);
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
    const remaining = (await remainingRecipients(campaignId, await campaignRules(campaignId))).length;
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
  const remaining = (await remainingRecipients(campaignId, await campaignRules(campaignId))).length;
  return { sent, failed, remaining, status: after.status, totalSent: after.totalSent, totalFailed: after.totalFailed };
}

/** Deletes a campaign that has never sent anything. */
export async function discardDraft(campaignId: string) {
  const c = await prisma.bulkCampaign.findUnique({ where: { id: campaignId }, select: { status: true, totalSent: true } });
  if (!c) throw new BulkError("Campaign not found.");
  if (c.status !== "DRAFT" || c.totalSent > 0) throw new BulkError("Only drafts that have not sent anything can be discarded.");
  await prisma.bulkCampaign.delete({ where: { id: campaignId } });
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,24}$/;

/** Distribution lists that forward to staff, from STAFF_SHARED_ADDRESSES (comma separated). */
export function sharedStaffAddresses(): string[] {
  return (process.env.STAFF_SHARED_ADDRESSES || "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Sends one copy of a template to one address, outside any campaign. Respects opt-outs.
 * Staff-only templates only go to a verified staff company address.
 */
export async function sendSingle(input: { templateId: string; values: Record<string, unknown>; email: string; actorId: string }) {
  const tpl = getTemplate(input.templateId);
  if (!tpl) throw new TemplateInputError("Unknown template.");
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) throw new TemplateInputError("Enter a valid email address.");

  const optedOut = await prisma.emailOptOut.findUnique({ where: { email } });
  if (optedOut && !isTransactional(tpl)) throw new BulkError("This address has unsubscribed from bulk email, so it cannot be sent to.");

  const staffMatch = await prisma.user.findFirst({
    where: { AND: [{ companyEmail: { equals: email, mode: "insensitive" } }, STAFF_WHERE] },
    select: { username: true },
  });
  // Shared staff distribution lists (a group that forwards to every staff member) are allowed here.
  // They must be listed in STAFF_SHARED_ADDRESSES. Each send to one is recorded in the audit log.
  const sharedStaffAddress = sharedStaffAddresses().includes(email);
  if (templateAudience(tpl) === "staff" && !staffMatch && !sharedStaffAddress) {
    throw new BulkError("Staff-only templates can only be sent to a verified staff company address.");
  }
  if (sharedStaffAddress && !staffMatch) {
    await prisma.auditLog.create({
      data: { actorId: input.actorId, action: "SHARED_STAFF_SEND", targetId: email, details: JSON.stringify({ templateId: tpl.id }) },
    });
  }

  const account = await prisma.user.findFirst({
    where: { OR: [{ email: { equals: email, mode: "insensitive" } }, { companyEmail: { equals: email, mode: "insensitive" } }] },
    select: { username: true },
  });
  const name = staffMatch?.username ?? account?.username ?? null;

  const m = renderEmail(tpl, normalizeValues(tpl, input.values), name, { unsubscribeUrl: unsubscribeUrl(email) });
  const { data, error } = await resendClient().emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: m.subject,
    html: m.html,
    text: m.text,
    headers: listHeaders(email),
  });
  if (error || !data) throw new BulkError("The email could not be sent. Check the sending settings.");
  return { sent: true, email };
}
