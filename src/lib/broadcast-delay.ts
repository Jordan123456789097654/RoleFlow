import { prisma } from "./prisma";
import { Resend } from "resend";

export interface DelayBroadcastResult {
  totalFound: number;
  sent: number;
  failed: number;
}

/**
 * Sends a launch delay announcement email to all collected emails across the database:
 * - User personal emails
 * - User company emails (staff & studio emails)
 * - Site submissions (newsletter subscribers, notify list, contact inquiries)
 * 
 * Sent from: RoleFlow <noreply@roleflow.site>
 */
export async function broadcastLaunchDelayEmail(): Promise<DelayBroadcastResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = "RoleFlow <noreply@roleflow.site>";

  // Collect all distinct email addresses across all tables
  const emailSet = new Map<string, string>(); // lowercase -> display name

  // 1. Users personal + company emails
  try {
    const users = await prisma.user.findMany({
      select: { email: true, companyEmail: true, username: true },
    });
    for (const u of users) {
      if (u.email) {
        const clean = u.email.trim().toLowerCase();
        if (clean.includes("@") && !emailSet.has(clean)) {
          emailSet.set(clean, u.username || "RoleFlow Member");
        }
      }
      if (u.companyEmail) {
        const clean = u.companyEmail.trim().toLowerCase();
        if (clean.includes("@") && !emailSet.has(clean)) {
          emailSet.set(clean, u.username || "RoleFlow Staff");
        }
      }
    }
  } catch (err) {
    console.error("Error collecting users for delay broadcast:", err);
  }

  // 2. Site Submissions (newsletter, notify list, contact inquiries, suggestions)
  try {
    const submissions = await prisma.siteSubmission.findMany({
      select: { email: true, name: true },
    });
    for (const s of submissions) {
      if (s.email) {
        const clean = s.email.trim().toLowerCase();
        if (clean.includes("@") && !emailSet.has(clean)) {
          emailSet.set(clean, s.name || "Subscriber");
        }
      }
    }
  } catch (err) {
    console.error("Error collecting submissions for delay broadcast:", err);
  }

  const recipients = Array.from(emailSet.entries()).map(([email, name]) => ({ email, name }));
  if (recipients.length === 0 || !apiKey) {
    console.warn("Delay broadcast skipped: 0 recipients found or RESEND_API_KEY missing.");
    return { totalFound: recipients.length, sent: 0, failed: 0 };
  }

  const resend = new Resend(apiKey);
  const subject = "Important Update: RoleFlow Official Launch Scheduled for Sunday, November 1st at 6:00 PM EDT";

  let sent = 0;
  let failed = 0;

  for (const { email, name } of recipients) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RoleFlow Launch Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #08090f; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0f111a; border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 10px 40px rgba(0,0,0,0.6); overflow: hidden;">
          <!-- Top Accent Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); height: 6px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">RoleFlow</span>
              <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #a78bfa;">Schedule Announcement</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 10px 36px 30px 36px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong style="color: #ffffff;">${name}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                We are writing to share an important schedule update regarding the official unveiling of the <strong>RoleFlow</strong> platform.
              </p>

              <!-- Highlight Callout Box -->
              <div style="background-color: rgba(139, 92, 246, 0.12); border-left: 4px solid #a855f7; border-radius: 8px; padding: 20px 24px; margin: 0 0 28px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c084fc;">
                  New Launch Date &amp; Time
                </p>
                <p style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px;">
                  Sunday, November 1st at 6:00 PM EDT
                </p>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                To guarantee zero downtime, rigorous security safeguards, and seamless cross-platform synchronization between our applications, we have finalized our live launch window for this Sunday evening.
              </p>

              <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                Our countdown and lockdown portals will remain active, and full platform access will unlock simultaneously across all communities at 6:00 PM EDT.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);">
                    <a href="https://roleflow.site" target="_blank" style="font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 14px 32px; display: inline-block; border-radius: 10px;">
                      Visit RoleFlow.site &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0b0c13; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                Sent from <strong style="color: #94a3b8;">noreply@roleflow.site</strong> &bull; RoleFlow Parent Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; 2026 RoleFlow. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to broadcast delay update to ${email}:`, err);
      failed++;
    }
  }

  return { totalFound: recipients.length, sent, failed };
}
