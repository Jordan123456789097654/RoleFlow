import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { findRecipients, noticeProgress, sendPolicyNotice } from "@/lib/policy-notice";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // a live send runs in chunks of up to CHUNK addresses per request

const NOTICE_ID = /^[A-Za-z0-9._-]{3,64}$/;
const CHUNK = 500;

function mask(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain ?? "?"}`;
}

/** Current progress for a notice ID: how many have been sent and how many remain. */
export async function GET(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const noticeId = new URL(request.url).searchParams.get("noticeId") ?? "";
  if (!NOTICE_ID.test(noticeId)) return NextResponse.json({ error: "Invalid notice ID." }, { status: 400 });
  return NextResponse.json(await noticeProgress(noticeId));
}

/**
 * dryRun: counts recipients and returns a few masked samples. Sends nothing.
 * live: sends to up to CHUNK unsent addresses. Call again until remaining is 0.
 */
export async function POST(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Only the founder can send policy notices." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const noticeId = String(body?.noticeId ?? "").trim();
  const dryRun = body?.dryRun !== false;
  const summary = String(body?.summary ?? "").trim();
  const updatedOn = String(body?.updatedOn ?? "").trim() || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (!NOTICE_ID.test(noticeId)) {
    return NextResponse.json({ error: "Notice ID must be 3 to 64 letters, numbers, dots, dashes, or underscores." }, { status: 400 });
  }

  if (dryRun) {
    const recipients = await findRecipients(noticeId);
    const progress = await noticeProgress(noticeId);
    return NextResponse.json({
      dryRun: true,
      wouldSend: recipients.length,
      alreadySent: progress.sent,
      samples: recipients.slice(0, 5).map((r) => ({ name: r.name, email: mask(r.email) })),
    });
  }

  if (summary.length < 20 || summary.length > 2000) {
    return NextResponse.json({ error: "Write a summary of what changed (20 to 2000 characters). It is shown in the email." }, { status: 400 });
  }

  const result = await sendPolicyNotice({ noticeId, summary, updatedOn, limit: CHUNK });
  await recordAudit({ actorId: caller.id, action: "POLICY_NOTICE_SENT", targetId: null, details: { noticeId, sent: result.sent, failed: result.failed, remaining: result.remaining } });
  return NextResponse.json({ dryRun: false, ...result });
}
