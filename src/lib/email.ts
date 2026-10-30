import { escapeHtml } from "./sanitize";
import { Resend } from "resend";
import { logger } from "./logger";
import { logEvent } from "./health";
import { platformOrigin } from "./platform-origin";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = new Resend(resendApiKey);

// Resend allows noreply@roleflow.site without custom domain verification
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RoleFlow <noreply@roleflow.site>";
const APP_URL = platformOrigin();

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Shared email layout. Matches RoleFlow's light theme: warm paper background, ink text,
 * and the accent color used for buttons and links.
 */
function renderEmailShell(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f1ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #161512; }
    h1 { font-size: 20px; font-weight: 700; color: #161512; margin: 0 0 12px; letter-spacing: -0.2px; }
    p { color: #3d3a33; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    a { color: #e5532d; }
    .button-container { text-align: center; margin: 28px 0 8px; }
    .btn { display: inline-block; background: #e5532d; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; }
    .card { background: #efebe1; border: 1px solid #d9d3c5; border-radius: 12px; padding: 14px 18px; margin: 18px 0; }
    .status-pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
    .status-accepted { background: #dcf2e4; color: #1f7a45; }
    .status-interview { background: #f8e1d9; color: #a8421f; }
    .status-rejected { background: #f9dede; color: #a12a2a; }
    .footer p { font-size: 12px; color: #958f80; margin: 4px 0; }
    .footer a { color: #6b665a; }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${title}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f4f1ea;">
    <tr>
      <td align="center" style="padding: 36px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #fbfaf6; border: 1px solid #d9d3c5; border-radius: 14px;">
          <tr>
            <td style="padding: 24px 36px 18px; border-bottom: 1px solid #efebe1;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <img src="https://roleflow.site/logo.png" alt="" width="28" height="28" style="display: block; border-radius: 7px;" />
                  </td>
                  <td style="vertical-align: middle; font-size: 16px; font-weight: 700; color: #161512; letter-spacing: -0.2px;">RoleFlow</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td class="footer" style="padding: 20px 36px; border-top: 1px solid #efebe1; background: #f4f1ea; border-radius: 0 0 14px 14px;">
              <p>RoleFlow · Applications and staff management for communities</p>
              <p>Questions? <a href="mailto:support@roleflow.site">support@roleflow.site</a></p>
              <p>You're receiving this because of activity on your RoleFlow account. <a href="${APP_URL}/privacy">Privacy</a> · <a href="${APP_URL}/terms">Terms</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

    <p style="font-size: 12px; color: #6b665a;">
      This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains completely secure.
    </p>

    <div class="card">
      <p style="margin: 0; font-size: 11px; color: #958f80; font-family: monospace;">
        Link not working? Paste this into your browser:<br>
        <span style="color: #e5532d; word-break: break-all;">${resetUrl}</span>
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
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #e5532d; text-transform: uppercase;">Note from Review Team:</p>
      <p style="margin: 0; font-size: 13px; color: #161512; font-style: italic;">"${escapeHtml(decisionNote)}"</p>
    </div>
  ` : "";

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      ${statusBadge}
    </div>
    <h1>${headline}</h1>
    <div class="card" style="border-left: 4px solid #e5532d;">
      <p style="margin: 0; font-size: 12px; color: #6b665a;">
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
      <p style="margin: 0; font-size: 12px; color: #3d3a33;">
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

  let badgeColor = "#b42318";
  let title = "Account Moderation Notice";
  let actionLabel = "Account Suspended";

  if (actionType === "WARNING") {
    badgeColor = "#b45309";
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
      <span style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; background: #f9dede; color: ${badgeColor}; border: 1px solid #e9b4b4;">
        ${actionLabel}
      </span>
    </div>

    <h1>${title}</h1>
    <p>Hi <strong>${escapeHtml(username)}</strong>,</p>
    <p>This is an automated notice from the <strong>RoleFlow Trust & Safety Team</strong> regarding enforcement action taken on your account.</p>

    <div class="card" style="border-left: 4px solid ${badgeColor};">
      <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #e5532d; text-transform: uppercase;">Moderation Details:</p>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #161512;"><strong>Action:</strong> ${actionLabel}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #161512;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      <p style="margin: 0; font-size: 13px; color: #161512;"><strong>Duration:</strong> ${isPermanent ? "Permanent" : expiresAt}</p>
    </div>

    <p style="font-size: 13px; color: #3d3a33; line-height: 1.6;">
      While this restriction is active, your ability to submit candidate applications, manage communities, or access candidate pools may be suspended in accordance with our <a href="${APP_URL}/acceptable-use" style="color: #e5532d; text-decoration: underline;">Acceptable Use Policy</a>.
    </p>

    <div class="card" style="background: #efebe1;">
      <p style="margin: 0; font-size: 12px; color: #6b665a;">
        If you believe this penalty was issued in error or wish to submit an appeal, please open a ticket in our official community support server or email <a href="mailto:support@roleflow.site" style="color: #e5532d;">support@roleflow.site</a> with your account ID.
      </p>
    </div>

    <div class="button-container">
      <a href="https://discord.gg/tKPbCXbmr9" class="btn" style="background: #e5532d;">Submit Moderation Appeal</a>
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
 * Goodbye email sent after an account is deleted. Includes a one-time,
 * unlinked "why are you leaving" survey link, which is unique to this email.
 */
export async function sendAccountDeletedEmail({
  toEmail,
  username,
  surveyId,
}: {
  toEmail: string;
  username: string;
  surveyId: string;
}): Promise<EmailResult> {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const surveyUrl = `${APP_URL}/leaving/${encodeURIComponent(surveyId)}`;
  const subject = "We're sad to see you go";
  const html = renderEmailShell(
    subject,
    `<p>Hi ${esc(username)},</p>` +
      `<p>We are sad to see you go. Your RoleFlow account and its data have been permanently deleted.</p>` +
      `<p>If you have a moment, tell us why you left. Your answer helps us decide what to fix and what to build next. It takes less than a minute, and it is not linked to your deleted account.</p>` +
      `<p style="margin:24px 0"><a href="${surveyUrl}" style="background:#7c3aed;color:#ffffff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">Tell us why you're leaving</a></p>` +
      `<p style="font-size:12px;color:#6b7280">This link works once and expires in 30 days. If you did not delete your account, contact support@roleflow.site right away.</p>`
  );
  try {
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: toEmail, subject, html });
    if (error) {
      await logEvent("ERROR", "email", `Goodbye email to ${toEmail} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    await logEvent("ERROR", "email", `Goodbye email to ${toEmail} threw: ${err?.message || "send failed"}`);
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
