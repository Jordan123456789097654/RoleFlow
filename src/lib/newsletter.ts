import { unsubscribeUrl } from "./unsubscribe";
import { prisma } from "./prisma";
import { Resend } from "resend";
import { optedOutSet } from "./unsubscribe";

export interface NewsletterRecipient {
  email: string;
  name?: string | null;
}

/**
 * Builds the HTML content for the monthly RoleFlow product newsletter or blog dispatch.
 * Strictly opt-in only, contains one-click unsubscribe links.
 */
export function renderNewsletterHtml({
  recipient,
  subject,
  headline,
  content,
  ctaText = "Read on RoleFlow Blog",
  ctaUrl,
}: {
  recipient: NewsletterRecipient;
  subject: string;
  headline: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const unsubLink = unsubscribeUrl(recipient.email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#090a0f; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#f1f3f9; }
    .container { max-width:600px; margin:32px auto; background:#10121a; border-radius:18px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; }
    .header { background:linear-gradient(135deg, #1f0d3d 0%, #100624 100%); padding:36px 32px; border-bottom:1px solid rgba(139,92,246,0.2); }
    .badge { display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#ddd6fe; background:rgba(139,92,246,0.25); border:1px solid rgba(139,92,246,0.4); padding:4px 10px; border-radius:999px; margin-bottom:12px; }
    .header h1 { color:#ffffff; font-size:24px; font-weight:800; line-height:1.25; margin:0 0 8px; }
    .header p { color:#c5cbd9; font-size:14px; margin:0; line-height:1.5; }
    .body { padding:32px; font-size:15px; line-height:1.75; color:#c5cbd9; }
    .body p { margin:0 0 16px; }
    .body ul { margin:0 0 20px; padding-left:20px; }
    .body li { margin-bottom:8px; }
    .body a { color:#a78bfa; text-decoration:underline; }
    .cta-wrap { margin:28px 0 12px; text-align:center; }
    .cta-btn { display:inline-block; background:#7c3aed; color:#ffffff !important; font-weight:700; font-size:14px; text-decoration:none !important; padding:12px 28px; border-radius:12px; box-shadow:0 4px 14px rgba(124,58,237,0.4); }
    .footer { padding:24px 32px; background:#0c0d14; border-top:1px solid rgba(255,255,255,0.08); text-align:center; font-size:12px; color:#6b7280; line-height:1.6; }
    .footer a { color:#9ca3af; text-decoration:underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">RoleFlow Dispatch</span>
      <h1>${subject}</h1>
      <p>${headline}</p>
    </div>
    <div class="body">
      ${content}
      ${ctaUrl ? `<div class="cta-wrap"><a href="${ctaUrl}" class="cta-btn">${ctaText} &rarr;</a></div>` : ""}
    </div>
    <div class="footer">
      <p>You received this update because you subscribed to the RoleFlow newsletter or early access updates.</p>
      <p>
        <a href="${unsubLink}">Unsubscribe with one click</a> &bull;
        <a href="https://roleflow.site/privacy">Privacy Policy</a> &bull;
        <a href="https://roleflow.site/terms">Terms of Service</a> &bull;
        <a href="https://roleflow.site/contact">Support</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatches an email notification about a published blog post to all opted-in newsletter subscribers.
 * Honors global opt-outs and unsubscribe records.
 */
export async function sendBlogPostEmailBlast({
  slug,
  title,
  excerpt,
  author,
  content,
}: {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  content: string[] | string;
}): Promise<{ sent: number; eligible: number }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "RoleFlow <onboarding@resend.dev>";
  const postUrl = `https://roleflow.site/blog/${encodeURIComponent(slug)}`;

  // 1. Fetch opt-in subscribers from site submissions
  const subscribers = await prisma.siteSubmission.findMany({
    where: { kind: "newsletter" },
    select: { email: true, name: true },
  });

  const optOuts = await optedOutSet();
  const distinctEmails = new Map<string, { email: string; name?: string | null }>();

  for (const s of subscribers) {
    const clean = s.email.trim().toLowerCase();
    if (!optOuts.has(clean) && !distinctEmails.has(clean)) {
      distinctEmails.set(clean, { email: clean, name: s.name });
    }
  }

  const recipients = Array.from(distinctEmails.values());
  if (recipients.length === 0 || !apiKey) {
    return { sent: 0, eligible: recipients.length };
  }

  const resend = new Resend(apiKey);
  const contentParagraphs = Array.isArray(content) ? content : [content];
  const previewHtml = contentParagraphs
    .slice(0, 3)
    .map((p) => `<p>${p}</p>`)
    .join("");

  const emailBody = `
    <p>Hey there,</p>
    <p>A new article was just published on the RoleFlow blog by <strong>${author}</strong>:</p>
    <div style="padding:16px 20px; background:#141724; border-left:3px solid #8b5cf6; border-radius:8px; margin:20px 0;">
      <h2 style="font-size:18px; color:#ffffff; margin:0 0 8px;">${title}</h2>
      <p style="font-size:13px; color:#a5b4fc; margin:0;">${excerpt}</p>
    </div>
    ${previewHtml}
    <p style="margin-top:24px;">Read the complete post with interactive assets on the RoleFlow official site:</p>
  `;

  let sent = 0;
  for (const recipient of recipients) {
    const html = renderNewsletterHtml({
      recipient,
      subject: `RoleFlow: ${title}`,
      headline: excerpt || "New story published on the RoleFlow Blog.",
      content: emailBody,
      ctaText: "Read Full Article on RoleFlow",
      ctaUrl: postUrl,
    });

    try {
      await resend.emails.send({
        from: fromEmail,
        to: recipient.email,
        subject: `[RoleFlow Update] ${title}`,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to dispatch blog post email to ${recipient.email}:`, err);
    }
  }

  return { sent, eligible: recipients.length };
}
