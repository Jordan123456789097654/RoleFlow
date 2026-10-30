import { test } from "node:test";
import assert from "node:assert/strict";
import { validateParentSubmission } from "./parent-submission";

test("validates contact submission with valid email and message", () => {
  const result = validateParentSubmission({
    kind: "contact",
    email: "user@example.com",
    name: "Alex",
    message: "Hello RoleFlow team, I have a question.",
  });
  assert.equal(result.ok, true);
  assert.equal(result.data?.email, "user@example.com");
  assert.equal(result.data?.kind, "contact");
});

test("validates notify and newsletter without requiring message", () => {
  const notify = validateParentSubmission({
    kind: "notify",
    email: "robloxdev@studio.org",
    interest: "roster",
  });
  assert.equal(notify.ok, true);
  assert.equal(notify.data?.interest, "roster");

  const news = validateParentSubmission({
    kind: "newsletter",
    email: "subscriber@community.gg",
  });
  assert.equal(news.ok, true);
});

test("rejects invalid email formats", () => {
  const badEmails = ["notanemail", "@missinguser.com", "user@", "spaces in@email.com"];
  for (const email of badEmails) {
    const res = validateParentSubmission({ kind: "newsletter", email });
    assert.equal(res.ok, false);
    assert.match(res.error || "", /valid email/i);
  }
});

test("rejects honeypot bots", () => {
  const botResult = validateParentSubmission({
    kind: "contact",
    email: "bot@spammer.net",
    message: "Buy cheap crypto",
    honeypot: "I am a bot filling every input",
  });
  assert.equal(botResult.ok, false);
  assert.equal(botResult.error, "Spam detected.");
});

test("rejects unknown submission kinds", () => {
  const res = validateParentSubmission({
    kind: "admin_takeover",
    email: "test@example.com",
  });
  assert.equal(res.ok, false);
  assert.match(res.error || "", /Invalid submission kind/i);
});

test("enforces length limits and trims inputs", () => {
  const longName = "a".repeat(150);
  const result = validateParentSubmission({
    kind: "idea",
    email: "  USER@EXAMPLE.COM  ",
    name: longName,
    message: "A great idea for community tools.",
  });
  assert.equal(result.ok, true);
  assert.equal(result.data?.email, "user@example.com");
  assert.equal(result.data?.name?.length, 100);
});
