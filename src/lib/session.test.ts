import { test } from "node:test";
import assert from "node:assert/strict";

process.env.APP_SECRET = "test-secret-at-least-16-chars";
const { signSessionValue, parseSessionValue } = await import("./session");

test("signed session parses back to its user id and version", () => {
  assert.deepEqual(parseSessionValue(signSessionValue("1046538179399929957", 3)), {
    userId: "1046538179399929957",
    sessionVersion: 3,
  });
});

test("bare user id with no signature is rejected", () => {
  assert.equal(parseSessionValue("1046538179399929957"), null);
});

test("tampered user id is rejected", () => {
  const signed = signSessionValue("111", 0);
  assert.equal(parseSessionValue(signed.replace("111", "222")), null);
});

test("tampered version is rejected", () => {
  const signed = signSessionValue("111", 0);
  assert.equal(parseSessionValue(signed.replace(".0.", ".9.")), null);
});

test("missing cookie is rejected", () => {
  assert.equal(parseSessionValue(undefined), null);
});
