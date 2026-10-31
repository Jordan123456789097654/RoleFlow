process.env.APP_SECRET = "test-secret-at-least-16-chars";

import { test } from "node:test";
import assert from "node:assert/strict";
import { mintRosterApplyHubToken, verifyRosterApplyHubToken } from "./roster-applyhub-token";

test("roster-applyhub-token: mints and verifies short-lived token", () => {
  const token = mintRosterApplyHubToken("usr_123", "grp_456");
  assert.ok(token);

  const payload = verifyRosterApplyHubToken(token);
  assert.deepEqual(payload, { u: "usr_123", g: "grp_456" });
});

test("roster-applyhub-token: rejects invalid or tampered token", () => {
  assert.equal(verifyRosterApplyHubToken("invalid.token.here"), null);
  assert.equal(verifyRosterApplyHubToken(null), null);
  assert.equal(verifyRosterApplyHubToken(""), null);
});
