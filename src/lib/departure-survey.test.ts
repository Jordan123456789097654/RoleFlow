import { test } from "node:test";
import assert from "node:assert/strict";
import { validateDepartureAnswer, surveyStatus, SURVEY_ID_PATTERN } from "./departure-survey";

test("accepts a known reason with an optional comment", () => {
  const r = validateDepartureAnswer({ reason: "privacy", comment: "  Please tell me more  " });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.data, { reason: "privacy", comment: "Please tell me more" });
});

test("empty comment becomes null", () => {
  const r = validateDepartureAnswer({ reason: "other", comment: "   " });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.comment, null);
});

test("rejects an unknown reason", () => {
  assert.equal(validateDepartureAnswer({ reason: "bored" }).ok, false);
});

test("rejects a missing body", () => {
  assert.equal(validateDepartureAnswer(null).ok, false);
});

test("rejects a comment over 1000 characters", () => {
  assert.equal(validateDepartureAnswer({ reason: "other", comment: "x".repeat(1001) }).ok, false);
});

test("rejects a non-text comment", () => {
  assert.equal(validateDepartureAnswer({ reason: "other", comment: 5 }).ok, false);
});

test("survey status: missing, expired, answered, open", () => {
  const now = new Date("2026-11-01T00:00:00Z");
  const future = new Date("2026-12-01T00:00:00Z");
  const past = new Date("2026-10-01T00:00:00Z");
  assert.equal(surveyStatus(null, now), "missing");
  assert.equal(surveyStatus({ expiresAt: past, submittedAt: null }, now), "expired");
  assert.equal(surveyStatus({ expiresAt: future, submittedAt: now }, now), "answered");
  assert.equal(surveyStatus({ expiresAt: future, submittedAt: null }, now), "open");
});

test("survey IDs must match the token pattern", () => {
  assert.equal(SURVEY_ID_PATTERN.test("a".repeat(32)), true);
  assert.equal(SURVEY_ID_PATTERN.test("short"), false);
  assert.equal(SURVEY_ID_PATTERN.test("../../etc/passwd" + "a".repeat(20)), false);
});
