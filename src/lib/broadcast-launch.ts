import { prisma } from "./prisma";
import { Resend } from "resend";

export interface BroadcastResult {
  totalFound: number;
  sent: number;
  failed: number;
}

/**
 * Sends a launch update email to all collected emails across the database:
 * - User accounts (personal email)
 * - User company emails (staff & studio emails)
 * - Site submissions (newsletter subscribers, notify list, contact inquiries)
 * 
 * Ignores unsubscriptions as mandated for critical system-wide relaunch/cutover.
 */
export async function broadcastAllEmailsLaunchUpdate(): Promise<BroadcastResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "RoleFlow <onboarding@resend.dev>";

  // Collect all distinct email addresses across all tables
  const emailSet = new Map<string, string>(); // lowercase -> display name

  // Users personal + company emails
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
    console.error("Error collecting users for launch broadcast:", err);
  }

  // Site Submissions (newsletter, notify, contact, idea)
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
    console.error("Error collecting submissions for launch broadcast:", err);
  }

  const recipients = Array.from(emailSet.entries()).map(([email, name]) => ({ email, name }));
  if (recipients.length === 0 || !apiKey) {
    return { totalFound: recipients.length, sent: 0, failed: 0 };
  }

  const resend = new Resend(apiKey);
  const subject = "RoleFlow is Live: Next-Generation Community Architecture";
  
  let sent = 0;
  let failed = 0;

  for (const { email, name } of recipients) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#090a0f; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#f1f3f9; }
    .container { max-width:600px; margin:32px auto; background:#10121a; border-radius:18px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; }
    .header { background:linear-gradient(135deg, #240c4a 0%, #0d061c 100%); padding:40px 32px; text-align:center; border-bottom:1px solid rgba(139,92,246,0.3); }
    .badge { display:inline-block; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#ddd6fe; background:rgba(139,92,246,0.25); border:1px solid rgba(139,92,246,0.5); padding:5px 12px; border-radius:999px; margin-bottom:14px; }
    .header h1 { color:#ffffff; font-size:26px; font-weight:900; margin:0 0 10px; }
    .header p { color:#c5cbd9; font-size:14px; margin:0; }
    .body { padding:32px; font-size:15px; line-height:1.75; color:#c5cbd9; }
    .body p { margin:0 0 16px; }
    .feature-card { background:#161926; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px 20px; margin:16px 0; }
    .feature-card h3 { color:#ffffff; margin:0 0 6px; font-size:16px; }
    .feature-card p { margin:0; font-size:13px; color:#9ca3af; }
    .cta { display:inline-block; background:#7c3aed; color:#ffffff !important; font-weight:700; font-size:15px; text-decoration:none !important; padding:14px 32px; border-radius:12px; margin:24px 0 8px; box-shadow:0 4px 18px rgba(124,58,237,0.4); }
    .footer { padding:24px 32px; background:#0c0d14; border-top:1px solid rgba(255,255,255,0.08); text-align:center; font-size:12px; color:#6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Official Platform Cutover</span>
      <h1>Something Greater Has Arrived.</h1>
      <p>RoleFlow has completed its architectural relaunch.</p>
    </div>
    <div class="body">
      <p>Hello ${name},</p>
      <p>Our countdown has concluded, and we are officially live with a completely rebuilt platform designed for Discord communities and Roblox game studios.</p>
      
      <div class="feature-card">
        <h3>🚀 ApplyHub by RoleFlow</h3>
        <p>Our flagship recruitment engine is now live on <a href="https://applyhub.roleflow.site" style="color:#a78bfa;">applyhub.roleflow.site</a> with blind voting, Roblox rank automation, and instant application queues.</p>
      </div>

      <div class="feature-card">
        <h3>👥 Roster by RoleFlow (In Active Development)</h3>
        <p>A unified staff and group activity suite for tracking shifts, member rosters, and training schedules across Roblox groups.</p>
      </div>

      <div class="feature-card">
        <h3>🔐 Unified Account Suite</h3>
        <p>Sign in once with Discord OAuth or email/password and manage all your communities and applications seamlessly.</p>
      </div>

      <div style="text-align:center;">
        <a href="https://roleflow.site" class="cta">Explore the New RoleFlow &rarr;</a>
      </div>

      <p style="margin-top:28px; font-size:13px; color:#9ca3af;">Thank you for being part of the RoleFlow ecosystem from day one.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} RoleFlow Inc. All tools are 100% free forever.</p>
      <p><a href="https://roleflow.site/privacy" style="color:#9ca3af;">Privacy Policy</a> &bull; <a href="https://roleflow.site/terms" style="color:#9ca3af;">Terms of Service</a> &bull; <a href="https://roleflow.site/contact" style="color:#9ca3af;">Contact</a></p>
    </div>
  </div>
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
      console.error(`Failed to broadcast to ${email}:`, err);
      failed++;
    }
  }

  return { totalFound: recipients.length, sent, failed };
}
