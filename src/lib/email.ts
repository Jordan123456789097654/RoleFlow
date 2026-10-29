import { escapeHtml } from "./sanitize";
import { Resend } from "resend";
import { logger } from "./logger";
import { logEvent } from "./health";

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
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="vertical-align: middle; padding-right: 12px;">
                <img src="https://roleflow.site/logo.png" alt="RoleFlow Logo" width="38" height="38" style="display: block; border-radius: 10px; border: 1px solid rgba(139, 92, 246, 0.4); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);" />
              </td>
              <td style="vertical-align: middle;">
                <span style="font-size: 20px; font-weight: 900; letter-spacing: 0.5px; color: #ffffff; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Role<span style="color: #a78bfa;">Flow</span>
                </span>
              </td>
            </tr>
          </table>
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
    <p>Hi <strong>${escapeHtml(username)}</strong>,</p>
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
    headline = "Application Accepted!";
    statusBadge = `<span class="status-pill status-accepted">✓ Accepted</span>`;
    messageBody = `
      <p>Congratulations <strong>${escapeHtml(applicantName)}</strong>! The staff team at <strong>${escapeHtml(communityName)}</strong> has officially <strong>accepted</strong> your application for <strong>${escapeHtml(positionTitle)}</strong>.</p>
      <p>Please check the candidate portal for onboarding details, instructions, or role synchronization.</p>
    `;
  } else if (status === "INTERVIEW") {
    headline = "You've Been Selected for an Interview!";
    statusBadge = `<span class="status-pill status-interview">✦ Interview Stage</span>`;
    messageBody = `
      <p>Great news <strong>${escapeHtml(applicantName)}</strong>! Your application for <strong>${escapeHtml(positionTitle)}</strong> at <strong>${escapeHtml(communityName)}</strong> has passed the initial screening, and staff would like to interview you.</p>
      <p>Please open the candidate thread to coordinate with the reviewers.</p>
    `;
  } else if (status === "REJECTED") {
    headline = "Application Status Update";
    statusBadge = `<span class="status-pill status-rejected">Application Not Accepted</span>`;
    messageBody = `
      <p>Hello <strong>${escapeHtml(applicantName)}</strong>,</p>
      <p>Thank you for taking the time to apply for <strong>${escapeHtml(positionTitle)}</strong> at <strong>${escapeHtml(communityName)}</strong>. After careful staff review, we will not be moving forward with your application at this time.</p>
      <p>We encourage you to continue developing your skills and re-apply in the future once the community cooldown period expires.</p>
    `;
  } else {
    headline = "Application Under Review";
    statusBadge = `<span class="status-pill status-interview">Under Review</span>`;
    messageBody = `
      <p>Hi <strong>${escapeHtml(applicantName)}</strong>, staff at <strong>${escapeHtml(communityName)}</strong> have started reviewing your application for <strong>${escapeHtml(positionTitle)}</strong>.</p>
    `;
  }

  const noteBlock = decisionNote ? `
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #a78bfa; text-transform: uppercase;">Note from Review Team:</p>
      <p style="margin: 0; font-size: 13px; color: #f1f5f9; font-style: italic;">"${escapeHtml(decisionNote)}"</p>
    </div>
  ` : "";

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      ${statusBadge}
    </div>
    <h1>${headline}</h1>
    <div class="card" style="border-left: 4px solid #8b5cf6;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        <strong>Position:</strong> ${escapeHtml(positionTitle)}<br>
        <strong>Community:</strong> ${escapeHtml(communityName)}
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
      html: renderEmailShell(`Status Update: ${escapeHtml(positionTitle)}`, contentHtml),
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
    <h1>Application Received! </h1>
    <p>Hi <strong>${escapeHtml(applicantName)}</strong>,</p>
    <p>Your application for <strong>${escapeHtml(positionTitle)}</strong> has been successfully submitted to <strong>${escapeHtml(communityName)}</strong>.</p>
    
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
      html: renderEmailShell(`Application Received: ${escapeHtml(positionTitle)}`, contentHtml),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 4. Send Account Moderation / Punishment Notice Email
 */
export async function sendModerationNoticeEmail({
  toEmail,
  username,
  actionType,
  reason,
  expiresAt,
}: {
  toEmail: string;
  username: string;
  actionType: "WARNING" | "SUSPENSION" | "BAN" | "BLACKLIST";
  reason: string;
  expiresAt?: string | null;
}): Promise<EmailResult> {
  const isPermanent = !expiresAt;

  let badgeColor = "#ef4444";
  let title = "Account Moderation Notice";
  let actionLabel = "Account Suspended";

  if (actionType === "WARNING") {
    badgeColor = "#f59e0b";
    title = "Official Policy Warning";
    actionLabel = "Warning Issued";
  } else if (actionType === "BLACKLIST") {
    badgeColor = "#e11d48";
    title = "Platform Blacklist Notice";
    actionLabel = "Permanently Blacklisted";
  } else if (actionType === "BAN") {
    badgeColor = "#dc2626";
    title = "Account Termination Notice";
    actionLabel = "Account Banned";
  }

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; background: rgba(239, 68, 68, 0.15); color: ${badgeColor}; border: 1px solid rgba(239, 68, 68, 0.3);">
        ${actionLabel}
      </span>
    </div>

    <h1>${title}</h1>
    <p>Hi <strong>${escapeHtml(username)}</strong>,</p>
    <p>This is an automated notice from the <strong>RoleFlow Trust & Safety Team</strong> regarding enforcement action taken on your account.</p>

    <div class="card" style="border-left: 4px solid ${badgeColor};">
      <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #a78bfa; text-transform: uppercase;">Moderation Details:</p>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #f1f5f9;"><strong>Action:</strong> ${actionLabel}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #f1f5f9;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      <p style="margin: 0; font-size: 13px; color: #f1f5f9;"><strong>Duration:</strong> ${isPermanent ? "Permanent" : expiresAt}</p>
    </div>

    <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
      While this restriction is active, your ability to submit candidate applications, manage communities, or access candidate pools may be suspended in accordance with our <a href="${APP_URL}/acceptable-use" style="color: #a78bfa; text-decoration: underline;">Acceptable Use Policy</a>.
    </p>

    <div class="card" style="background: rgba(255, 255, 255, 0.03);">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        If you believe this penalty was issued in error or wish to submit an appeal, please open a ticket in our official community support server or email <a href="mailto:support@roleflow.site" style="color: #a78bfa;">support@roleflow.site</a> with your account ID.
      </p>
    </div>

    <div class="button-container">
      <a href="https://discord.gg/tKPbCXbmr9" class="btn" style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);">Submit Moderation Appeal</a>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: `[RoleFlow Notice] ${title} - Action Taken on Your Account`,
      html: renderEmailShell(title, contentHtml),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/** Short account-security notice (new device sign-in, support access). */
export async function sendSecurityNoticeEmail({
  toEmail,
  username,
  heading,
  message,
}: {
  toEmail: string;
  username: string;
  heading: string;
  message: string;
}): Promise<EmailResult> {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = renderEmailShell(
    heading,
    `<p>Hi ${esc(username)},</p><p>${esc(message)}</p><p>If this wasn't you, change your password and contact RoleFlow support.</p>`
  );
  try {
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: toEmail, subject: heading, html });
    if (error) {
      await logEvent("ERROR", "email", `Security notice to ${toEmail} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    await logEvent("ERROR", "email", `Security notice to ${toEmail} threw: ${err?.message || "send failed"}`);
    return { success: false, error: err?.message || "send failed" };
  }
}


/**
 * 11. Deadline reminder: sent once per position, when it closes within the next 24 hours.
 */
export async function sendDeadlineReminderEmail({
  toEmail,
  applicantName,
  communityName,
  positionTitle,
  closesAt,
  positionId,
}: {
  toEmail: string;
  applicantName: string;
  communityName: string;
  positionTitle: string;
  closesAt: Date;
  positionId: string;
}): Promise<EmailResult> {
  const subject = `Applications for ${positionTitle} close soon`;
  const closeText = closesAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
  const link = `${APP_URL}/apply/${positionId}`;

  const contentHtml = `
    <p>Hi ${escapeHtml(applicantName)},</p>
    <p>You saved <strong>${escapeHtml(positionTitle)}</strong> at <strong>${escapeHtml(communityName)}</strong>. Applications close on <strong>${escapeHtml(closeText)}</strong>.</p>
    <p><a href="${link}">Finish your application</a></p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject,
      html: renderEmailShell(subject, contentHtml),
    });
    if (error) {
      logger.error("Failed to send deadline reminder via Resend", { error, toEmail });
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    logger.error("Resend error sending deadline reminder", { err: err.message, toEmail });
    return { success: false, error: err.message };
  }
}
