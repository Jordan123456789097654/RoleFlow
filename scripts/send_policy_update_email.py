#!/usr/bin/env python3
"""
Send a policy-update notice to RoleFlow users by email.

Who receives it:
  * the email address on each account, when the account has email notifications turned on,
    the address has not been removed, and the account is not banned
  * every verified company email, on any account that is not banned
    (company emails are used for admin verification and are included regardless of the notifications setting)

An address that appears more than once is sent to once.

Safe to re-run: every address that gets the notice is written to policy_notice_log,
and those addresses are skipped on later runs with the same --notice-id.

Requirements:
  pip install psycopg[binary] requests

Environment variables:
  DATABASE_URL        PostgreSQL connection string (same one the website uses)
  RESEND_API_KEY      Resend API key
  RESEND_FROM_EMAIL   e.g. "RoleFlow <notices@roleflow.site>" (must be a verified sender in Resend)
  PLATFORM_URL        optional, defaults to https://roleflow.site

Usage:
  # 1. Dry run: prints how many people would be emailed, sends nothing
  python send_policy_update_email.py --notice-id 2026-10-29 --dry-run

  # 2. Send to a test address first
  python send_policy_update_email.py --notice-id 2026-10-29 --test-to you@example.com

  # 3. Send to everyone
  python send_policy_update_email.py --notice-id 2026-10-29
"""

import argparse
import html
import logging
import os
import sys
import time
from datetime import datetime, timezone

import psycopg
import requests

RESEND_BATCH_URL = "https://api.resend.com/emails/batch"
BATCH_SIZE = 100          # Resend's batch endpoint accepts up to 100 messages per call
PAUSE_BETWEEN_BATCHES = 1.0

POLICIES = [
    ("privacy", "Privacy Policy"),
    ("terms", "Terms of Service"),
    ("acceptable-use", "Acceptable Use Policy"),
    ("community-guidelines", "Community Guidelines"),
    ("cookies", "Cookie Policy"),
]

# Edit this to describe what actually changed. Keep it short and factual.
SUMMARY_LINES = [
    "We updated our policies to explain how you can remove specific information from your account, how account deletion works, and how we handle reports.",
    "Nothing you need to do is required unless you want to review the changes.",
]

LOG = logging.getLogger("policy-notice")


def build_email(first_name_hint: str, platform_url: str, updated_on: str):
    """Returns (subject, html, text) for one recipient."""
    subject = "Updates to RoleFlow's policies"
    links_html = "".join(
        f'<li><a href="{platform_url}/{slug}">{html.escape(label)}</a></li>' for slug, label in POLICIES
    )
    links_text = "\n".join(f"  - {label}: {platform_url}/{slug}" for slug, label in POLICIES)
    summary_html = "".join(f"<p>{html.escape(line)}</p>" for line in SUMMARY_LINES)
    summary_text = "\n\n".join(SUMMARY_LINES)

    greeting = f"Hi {html.escape(first_name_hint)}," if first_name_hint else "Hi,"
    body_html = f"""
<html><body style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#161512; background:#f4f1ea; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:28px;">
    <p>{greeting}</p>
    <p>We have updated the policies on RoleFlow. These changes took effect on <strong>{html.escape(updated_on)}</strong>.</p>
    {summary_html}
    <p>The updated policies:</p>
    <ul>{links_html}</ul>
    <p style="font-size:12px; color:#6b665c;">
      You are receiving this because you have a RoleFlow account, or a verified company email linked to one.
      You can manage email notifications in Settings.
    </p>
  </div>
</body></html>"""

    body_text = (
        f"{'Hi ' + first_name_hint + ',' if first_name_hint else 'Hi,'}\n\n"
        f"We have updated the policies on RoleFlow. These changes took effect on {updated_on}.\n\n"
        f"{summary_text}\n\n"
        f"The updated policies:\n{links_text}\n\n"
        "You are receiving this because you have a RoleFlow account, or a verified company email linked to one. "
        "You can manage email notifications in Settings.\n"
    )
    return subject, body_html, body_text


def ensure_log_table(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS policy_notice_log (
                notice_id   TEXT        NOT NULL,
                user_id     TEXT        NOT NULL,
                email       TEXT        NOT NULL,
                sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
                resend_id   TEXT,
                PRIMARY KEY (notice_id, email)
            )
            """
        )
    conn.commit()


def fetch_recipients(conn, notice_id: str):
    """
    Returns (user_id, username, email) for every address that should receive this notice
    and has not received it yet. Each address appears once.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT u.id, u.username, u.email
              FROM "User" u
             WHERE u.email IS NOT NULL AND u.email <> ''
               AND u."emailRemovedAt" IS NULL
               AND u."emailNotifications" = true
               AND u."isBanned" = false
            """
        )
        primary = cur.fetchall()

        cur.execute(
            """
            SELECT u.id, u.username, u."companyEmail"
              FROM "User" u
             WHERE u."companyEmail" IS NOT NULL AND u."companyEmail" <> ''
               AND u."companyEmailVerifiedAt" IS NOT NULL
               AND u."isBanned" = false
            """
        )
        company = cur.fetchall()

        cur.execute("SELECT email FROM policy_notice_log WHERE notice_id = %s", (notice_id,))
        already = {row[0].lower() for row in cur.fetchall()}

    seen = set(already)
    recipients = []
    for user_id, username, email in primary + company:
        key = email.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        recipients.append((user_id, username, email.strip()))
    return recipients


def send_batch(api_key: str, from_addr: str, messages: list):
    """Sends up to 100 messages. Returns a list of Resend ids in the same order, or raises."""
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    for attempt in range(5):
        res = requests.post(RESEND_BATCH_URL, json=messages, headers=headers, timeout=30)
        if res.status_code == 429:
            wait = 2 ** attempt
            LOG.warning("Rate limited by Resend, waiting %ss", wait)
            time.sleep(wait)
            continue
        if res.ok:
            data = res.json().get("data", [])
            return [item.get("id") for item in data]
        raise RuntimeError(f"Resend batch failed: {res.status_code} {res.text}")
    raise RuntimeError("Resend batch failed after retries")


def main():
    parser = argparse.ArgumentParser(description="Email the policy update notice to RoleFlow users.")
    parser.add_argument("--notice-id", required=True, help="A unique id for this notice, e.g. 2026-10-29. Used to avoid double sends.")
    parser.add_argument("--updated-on", default=datetime.now(timezone.utc).strftime("%B %d, %Y"), help='Date shown in the email, e.g. "October 29, 2026".')
    parser.add_argument("--dry-run", action="store_true", help="Count recipients and print a sample. Sends nothing.")
    parser.add_argument("--test-to", help="Send one test copy to this address instead of all users.")
    parser.add_argument("--limit", type=int, default=0, help="Send to at most this many users (useful for a first real batch).")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    database_url = os.environ.get("DATABASE_URL")
    api_key = os.environ.get("RESEND_API_KEY")
    from_addr = os.environ.get("RESEND_FROM_EMAIL", "RoleFlow <onboarding@resend.dev>")
    platform_url = os.environ.get("PLATFORM_URL", "https://roleflow.site").rstrip("/")

    if not database_url:
        sys.exit("DATABASE_URL is not set.")
    if not args.dry_run and not api_key:
        sys.exit("RESEND_API_KEY is not set.")

    # Test mode: one message, no database writes.
    if args.test_to:
        subject, body_html, body_text = build_email("", platform_url, args.updated_on)
        if args.dry_run:
            LOG.info("Dry run: would send one test email to %s", args.test_to)
            return
        ids = send_batch(api_key, from_addr, [{
            "from": from_addr, "to": [args.test_to], "subject": "[TEST] " + subject,
            "html": body_html, "text": body_text,
        }])
        LOG.info("Test email sent to %s (id %s)", args.test_to, ids[0] if ids else "unknown")
        return

    with psycopg.connect(database_url) as conn:
        ensure_log_table(conn)
        recipients = fetch_recipients(conn, args.notice_id)
        if args.limit:
            recipients = recipients[: args.limit]

        LOG.info("Notice %s: %d recipient(s) not yet emailed", args.notice_id, len(recipients))
        if args.dry_run:
            for user_id, username, email in recipients[:5]:
                LOG.info("  sample: %s <%s>", username, email[:3] + "***")
            LOG.info("Dry run complete. Nothing was sent.")
            return
        if not recipients:
            LOG.info("Nothing to send.")
            return

        sent = failed = 0
        for start in range(0, len(recipients), BATCH_SIZE):
            chunk = recipients[start : start + BATCH_SIZE]
            messages = []
            for user_id, username, email in chunk:
                subject, body_html, body_text = build_email(username, platform_url, args.updated_on)
                messages.append({
                    "from": from_addr,
                    "to": [email],
                    "subject": subject,
                    "html": body_html,
                    "text": body_text,
                })
            try:
                resend_ids = send_batch(api_key, from_addr, messages)
            except Exception as err:
                LOG.error("Batch starting at %d failed: %s", start, err)
                failed += len(chunk)
                continue

            with conn.cursor() as cur:
                for i, (user_id, username, email) in enumerate(chunk):
                    rid = resend_ids[i] if i < len(resend_ids) else None
                    cur.execute(
                        """
                        INSERT INTO policy_notice_log (notice_id, user_id, email, resend_id)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (notice_id, email) DO NOTHING
                        """,
                        (args.notice_id, user_id, email, rid),
                    )
            conn.commit()
            sent += len(chunk)
            LOG.info("Sent %d / %d", sent, len(recipients))
            time.sleep(PAUSE_BETWEEN_BATCHES)

        LOG.info("Finished. Sent: %d. Failed: %d. Re-run with the same --notice-id to retry only the failed ones.", sent, failed)


if __name__ == "__main__":
    main()
