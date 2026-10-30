import { emailFromUnsubscribeToken, recordOptOut } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

const STYLE = `body{margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#161512}
.card{max-width:480px;margin:60px auto;background:#fff;border-radius:12px;padding:28px}
button{background:#e5532d;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-weight:600;cursor:pointer}
p{line-height:1.55}`;

function page(title: string, inner: string, status = 200) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${STYLE}</style></head><body><div class="card">${inner}</div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });
}

const BAD = `<h1 style="font-size:20px">This link is not valid</h1><p>It may be incomplete or expired. Reply to any RoleFlow email and we will remove you by hand.</p>`;

/** Confirmation page. The form posts back, so a mail scanner that only follows links does not unsubscribe anyone. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!emailFromUnsubscribeToken(token)) return page("Unsubscribe", BAD, 400);
  const action = `/api/unsubscribe?token=${encodeURIComponent(token!)}`;
  return page(
    "Unsubscribe",
    `<h1 style="font-size:20px">Stop receiving RoleFlow updates?</h1>
     <p>You will no longer receive bulk updates, newsletters, and announcements at this address. You will still get messages about your own applications and account.</p>
     <form method="POST" action="${action}"><button type="submit">Unsubscribe</button></form>`
  );
}

/** Records the opt-out. Also used by the one-click header that mail clients send (RFC 8058). */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const email = emailFromUnsubscribeToken(token);
  if (!email) return page("Unsubscribe", BAD, 400);
  await recordOptOut(email, "UNSUBSCRIBE_LINK");
  return page(
    "Unsubscribed",
    `<h1 style="font-size:20px">You are unsubscribed</h1><p>We will not send bulk updates to this address anymore. Changing your mind? Sign in and turn email notifications back on in Settings.</p>`
  );
}
