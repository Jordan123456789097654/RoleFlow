import { prisma } from "@/lib/prisma";

export type WebhookField = { name: string; value: string; inline?: boolean };

const URL_PATTERN = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//;

/**
 * Posts a short notice to the support reports Discord channel. Reads DISCORD_REPORT_WEBHOOK_URL.
 * Never throws: a failed post must not stop a report from being filed or reviewed.
 * Only short summaries are posted. Full report answers stay on the website.
 */
export async function postReportNotice(opts: { title: string; color: number; fields: WebhookField[]; reportId: string }) {
  const url = process.env.DISCORD_REPORT_WEBHOOK_URL ?? "";
  if (!URL_PATTERN.test(url)) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [{
          title: opts.title.slice(0, 256),
          color: opts.color,
          fields: opts.fields.slice(0, 25).map((f) => ({
            name: f.name.slice(0, 256),
            value: (f.value || "-").slice(0, 1024),
            inline: f.inline ?? true,
          })),
          footer: { text: `Report ${opts.reportId}` },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    if (!res.ok) console.error("Report webhook responded", res.status);
  } catch (err) {
    console.error("Report webhook failed", err);
  }
}

/** Records one entry in a report's history. */
export async function logReportEvent(input: { reportId: string; actorId: string; actorName?: string | null; action: string; note?: string | null; details?: unknown }) {
  await prisma.supportReportEvent.create({
    data: {
      reportId: input.reportId,
      actorId: input.actorId,
      actorName: input.actorName ?? null,
      action: input.action,
      note: input.note ?? null,
      details: input.details ? JSON.stringify(input.details) : null,
    },
  });
}
