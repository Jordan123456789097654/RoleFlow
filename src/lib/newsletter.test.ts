import { test } from "node:test";
import assert from "node:assert/strict";
import { renderNewsletterHtml } from "./newsletter";

test("renders newsletter html with recipient email and unsubscribe link", () => {
  process.env.APP_SECRET = "abcdefghijklmnopqrstuvwxyz123456";
  const html = renderNewsletterHtml({
    recipient: { email: "test@example.com" },
    subject: "RoleFlow October 2026 Newsletter",
    headline: "What's new across ApplyHub & Roster",
    content: "<p>Exciting new updates this month.</p>",
  });

  assert.match(html, /RoleFlow Dispatch/);
  assert.match(html, /RoleFlow October 2026 Newsletter/);
  assert.match(html, /What's new across ApplyHub & Roster/);
  assert.match(html, /api\/unsubscribe\?token=/);
  assert.match(html, /Unsubscribe with one click/);
});
