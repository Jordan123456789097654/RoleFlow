import { Resend } from "resend";
import { logger } from "./logger";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = new Resend(resendApiKey);

// Resend allows onboarding@resend.dev without custom domain verification
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RoleFlow <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://roleflow.site";

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Base email layout wrapper with RoleFlow Obsidian Dark branding
 */
function renderEmailShell(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0b12;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0b12;
      padding: 40px 10px;
    }
    .main {
      background-color: #12111c;
      margin: 0 auto;
      max-width: 560px;
      border-radius: 16px;
      border: 1px solid rgba(139, 92, 246, 0.2);
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 30px 40px;
      background: linear-gradient(180deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
    }
    .logo-badge {
      display: inline-block;
      padding: 8px 16px;
      background-color: #7c3aed;
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 1px;
      border-radius: 10px;
      text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
    }
    .content {
      padding: 36px 40px;
      line-height: 1.6;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
    }
    .card {
      background-color: #1a1827;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .footer {
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      background-color: #0d0c15;
    }
    .footer p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0;
    }
    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
    }
    .status-accepted {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .status-interview {
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .status-rejected {
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <div class="logo-badge">RoleFlow</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${contentHtml}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>© 2026 RoleFlow • The Modern Community ATS & Applicant Workflow</p>
          <p>Official Support: <a href="mailto:support@roleflow.site" style="color: #8b5cf6; text-decoration: none;">support@roleflow.site</a></p>
          <p>You received this because an application or account action occurred on <a href="${APP_URL}" style="color: #94a3b8; text-decoration: none;">roleflow.site</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}

/**
 * 1. Send Password Reset Email
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  username: string,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

  const contentHtml = `
    <h1>Password Reset Request</h1>
    <p>Hi <strong>${username}</strong>,</p>
    <p>We received a request to reset your password on RoleFlow. Click the button below to choose a new secure password:</p>
    
    <div class="button-container">
      <a href="${resetUrl}" class="btn">Reset My Password</a>
    </div>

    <p style="font-size: 12px; color: #94a3b8;">
      This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
    </p>

    <div class="card">
      <p style="margin: 0; font-size: 11px; color: #64748b; font-family: monospace;">
        Link not working? Paste this into your browser:<br>
        <span style="color: #a78bfa; word-break: break-all;">${resetUrl}</span>
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: "Reset your RoleFlow Password",
      html: renderEmailShell("Reset your RoleFlow Password", contentHtml),
    });

    if (error) {
      logger.error("Failed to send password reset email via Resend", { error, toEmail });
      return { success: false, error: error.message };
    }

    logger.info("Password reset email dispatched successfully", { id: data?.id, toEmail });
    return { success: true, id: data?.id };
  } catch (err: any) {
    logger.error("Resend error sending password reset", { err: err.message, toEmail });
    return { success: false, error: err.message };
  }
}

/**
 * 2. Send Application Status Decision Email (Accepted, Rejected, Interview)
 */
export async function sendApplicationStatusEmail({
  toEmail,
  applicantName,
  communityName,
  positionTitle,
  status,
  decisionNote,
  applicationId,
}: {
  toEmail: string;
  applicantName: string;
  communityName: string;
  positionTitle: string;
  status: "ACCEPTED" | "REJECTED" | "INTERVIEW" | "UNDER_REVIEW";
  decisionNote?: string | null;
  applicationId: string;
}): Promise<EmailResult> {
  const appUrl = `${APP_URL}/my-applications`;

  let headline = "";
  let statusBadge = "";
  let messageBody = "";

  if (status === "ACCEPTED") {
    headline = "🎉 Application Accepted!";
    statusBadge = `<span class="status-pill status-accepted">✓ Accepted</span>`;
    messageBody = `
      <p>Congratulations <strong>${applicantName}</strong>! The staff team at <strong>${communityName}</strong> has officially <strong>accepted</strong> your application for <strong>${positionTitle}</strong>.</p>
      <p>Please check the candidate portal for onboarding details, instructions, or role synchronization.</p>
    `;
  } else if (status === "INTERVIEW") {
    headline = "🎙️ You've Been Selected for an Interview!";
    statusBadge = `<span class="status-pill status-interview">✦ Interview Stage</span>`;
    messageBody = `
      <p>Great news <strong>${applicantName}</strong>! Your application for <strong>${positionTitle}</strong> at <strong>${communityName}</strong> has passed the initial screening, and staff would like to interview you.</p>
      <p>Please open the candidate thread to coordinate with the reviewers.</p>
    `;
  } else if (status === "REJECTED") {
    headline = "Application Status Update";
    statusBadge = `<span class="status-pill status-rejected">Application Not Accepted</span>`;
    messageBody = `
      <p>Hello <strong>${applicantName}</strong>,</p>
      <p>Thank you for taking the time to apply for <strong>${positionTitle}</strong> at <strong>${communityName}</strong>. After careful staff review, we will not be moving forward with your application at this time.</p>
      <p>We encourage you to continue developing your skills and re-apply in the future once the community cooldown period expires.</p>
    `;
  } else {
    headline = "Application Under Review";
    statusBadge = `<span class="status-pill status-interview">Under Review</span>`;
    messageBody = `
      <p>Hi <strong>${applicantName}</strong>, staff at <strong>${communityName}</strong> have started reviewing your application for <strong>${positionTitle}</strong>.</p>
    `;
  }

  const noteBlock = decisionNote ? `
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #a78bfa; text-transform: uppercase;">Note from Review Team:</p>
      <p style="margin: 0; font-size: 13px; color: #f1f5f9; font-style: italic;">"${decisionNote}"</p>
    </div>
  ` : "";

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      ${statusBadge}
    </div>
    <h1>${headline}</h1>
    <div class="card" style="border-left: 4px solid #8b5cf6;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        <strong>Position:</strong> ${positionTitle}<br>
        <strong>Community:</strong> ${communityName}
      </p>
    </div>

    ${messageBody}
    ${noteBlock}

    <div class="button-container">
      <a href="${appUrl}" class="btn">View in My Applications</a>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `[${communityName}] Status Update: ${positionTitle} Application`,
      html: renderEmailShell(`Status Update: ${positionTitle}`, contentHtml),
    });

    if (error) {
      logger.error("Failed to send status update email via Resend", { error, toEmail, applicationId });
      return { success: false, error: error.message };
    }

    logger.info("Application status email dispatched", { id: data?.id, toEmail, status });
    return { success: true, id: data?.id };
  } catch (err: any) {
    logger.error("Resend error sending status email", { err: err.message, toEmail });
    return { success: false, error: err.message };
  }
}

/**
 * 3. Send Application Submission Receipt Email
 */
export async function sendApplicationSubmissionReceipt({
  toEmail,
  applicantName,
  communityName,
  positionTitle,
}: {
  toEmail: string;
  applicantName: string;
  communityName: string;
  positionTitle: string;
}): Promise<EmailResult> {
  const appUrl = `${APP_URL}/my-applications`;

  const contentHtml = `
    <h1>Application Received! 📥</h1>
    <p>Hi <strong>${applicantName}</strong>,</p>
    <p>Your application for <strong>${positionTitle}</strong> has been successfully submitted to <strong>${communityName}</strong>.</p>
    
    <div class="card">
      <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
        The community's recruitment team has been notified. You will receive an automated email notification as soon as your application is reviewed or a decision is made.
      </p>
    </div>

    <div class="button-container">
      <a href="${appUrl}" class="btn">Track Application Status</a>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `Application Received: ${positionTitle} at ${communityName}`,
      html: renderEmailShell(`Application Received: ${positionTitle}`, contentHtml),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
