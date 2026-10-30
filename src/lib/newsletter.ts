import { unsubscribeUrl, recordOptOut } from "./unsubscribe";

export interface NewsletterRecipient {
  email: string;
  name?: string | null;
}

/**
 * Builds the HTML content for the monthly RoleFlow product newsletter.
 * Strictly opt-in only, contains one-click unsubscribe links.
 */
export function renderNewsletterHtml({
  recipient,
  subject,
  headline,
  content,
}: {
  recipient: NewsletterRecipient;
  subject: string;
  headline: string;
  content: string;
}): string {
  const unsubLink = unsubscribeUrl(recipient.email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:#f4f1ea; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#08090d; }
    .container { max-width:580px; margin:40px auto; background:#ffffff; border-radius:16px; border:1px solid #e5e2da; overflow:hidden; }
    .header { background:#130826; padding:32px 28px; text-align:center; }
    .header h1 { color:#ffffff; font-size:22px; font-weight:800; margin:0 0 6px; }
    .header p { color:#ddd6fe; font-size:13px; margin:0; }
    .body { padding:32px 28px; font-size:14px; line-height:1.65; color:#2c2825; }
    .footer { padding:24px 28px; background:#fbf9f5; border-top:1px solid #e5e2da; text-align:center; font-size:12px; color:#858076; }
    .footer a { color:#5a2aa2; text-decoration:underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RoleFlow Monthly Update</h1>
      <p>${headline}</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>You received this email because you opted into the RoleFlow product newsletter on roleflow.site.</p>
      <p>
        <a href="${unsubLink}">Unsubscribe with one click</a> &bull;
        <a href="https://roleflow.site/privacy">Privacy Policy</a> &bull;
        <a href="https://roleflow.site/contact">Support</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
