import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { optedOutSet } from "@/lib/unsubscribe";
import { renderNewsletterHtml } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RoleFlow <noreply@roleflow.site>";

/**
 * Monthly newsletter dispatcher cron job.
 * Protected by: Authorization: Bearer $CRON_SECRET
 * Sends monthly updates exclusively to opted-in recipients who haven't unsubscribed.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch all opt-in newsletter subscribers from SiteSubmission
  const subscribers = await prisma.siteSubmission.findMany({
    where: { kind: "newsletter" },
    select: { email: true, name: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ success: true, message: "No subscribers found.", sentCount: 0 });
  }

  // 2. Fetch global email opt-outs
  const optOuts = await optedOutSet();

  // 3. Filter distinct active subscribers
  const distinctEmails = new Map<string, { email: string; name?: string | null }>();
  for (const s of subscribers) {
    const clean = s.email.trim().toLowerCase();
    if (!optOuts.has(clean) && !distinctEmails.has(clean)) {
      distinctEmails.set(clean, { email: clean, name: s.name });
    }
  }

  const recipients = Array.from(distinctEmails.values());
  if (recipients.length === 0) {
    return NextResponse.json({ success: true, message: "All subscribers are opted out.", sentCount: 0 });
  }

  const monthName = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const subject = `RoleFlow Product Update — ${monthName}`;
  const headline = `News, releases, and roadmap progress across the RoleFlow family.`;
  const content = `
    <p>Hello,</p>
    <p>Here is your monthly recap of everything happening across RoleFlow:</p>
    <ul>
      <li><strong>ApplyHub:</strong> We've completed our platform separation, boosting application speed and dedicated recruitment reliability.</li>
      <li><strong>Roster by RoleFlow:</strong> Department rosters and Roblox group staff tracking development is officially underway.</li>
      <li><strong>Unified Account:</strong> You can now link your email/password and Discord login under Settings for seamless access everywhere.</li>
    </ul>
    <p>Have an idea for the next community tool? Drop your suggestions anytime on <a href="https://roleflow.site/ideas">roleflow.site/ideas</a>.</p>
    <p>— The RoleFlow Team</p>
  `;

  let sentCount = 0;
  if (resend) {
    for (const recipient of recipients) {
      const html = renderNewsletterHtml({
        recipient,
        subject,
        headline,
        content,
      });

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient.email,
          subject,
          html,
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send newsletter to ${recipient.email}:`, err);
      }
    }
  }

  return NextResponse.json({
    success: true,
    month: monthName,
    eligibleSubscribers: recipients.length,
    sentCount,
  });
}

export const GET = run;
export const POST = run;
