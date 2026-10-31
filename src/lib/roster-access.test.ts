import { test } from "node:test";
import assert from "node:assert/strict";
import { canAccessRoster, isRosterGloballyEnabled, rosterAllowlistUserIds } from "./roster-access";

test("Roster access control: flag default (or not false) returns true for everyone", () => {
  delete process.env.ROSTER_ENABLED;
  assert.equal(isRosterGloballyEnabled(), true);
  assert.equal(canAccessRoster(null), true);
  assert.equal(canAccessRoster(undefined), true);
  assert.equal(canAccessRoster({ userId: "any_user" }), true);
});

test("Roster access control: explicit ROSTER_ENABLED=false restricts unlisted users", () => {
  process.env.ROSTER_ENABLED = "false";
  process.env.ROSTER_ALLOWLIST_USER_IDS = "user_owner_123,1046538179399929957";

  assert.equal(isRosterGloballyEnabled(), false);
  assert.equal(canAccessRoster(null), false);
  assert.equal(canAccessRoster(undefined), false);
  assert.equal(canAccessRoster({ userId: "normal_user_456" }), false);
  assert.equal(canAccessRoster({ discordId: "999999999999999999" }), false);
});

test("Roster access control: flag off returns true for allowlisted user by userId or discordId", () => {
  process.env.ROSTER_ENABLED = "false";
  process.env.ROSTER_ALLOWLIST_USER_IDS = "user_owner_123, 1046538179399929957 , user_staff_789";

  assert.equal(canAccessRoster({ userId: "user_owner_123" }), true);
  assert.equal(canAccessRoster({ discordId: "1046538179399929957" }), true);
  assert.equal(canAccessRoster({ userId: "user_staff_789" }), true);
  assert.equal(canAccessRoster({ userId: "unknown" }), false);
});

test("Roster access control: flag on returns true for everyone (even anonymous or unlisted)", () => {
  process.env.ROSTER_ENABLED = "true";
  process.env.ROSTER_ALLOWLIST_USER_IDS = "";

  assert.equal(isRosterGloballyEnabled(), true);
  assert.equal(canAccessRoster(null), true);
  assert.equal(canAccessRoster(undefined), true);
  assert.equal(canAccessRoster({ userId: "any_user" }), true);
  assert.equal(canAccessRoster({ discordId: "any_discord_id" }), true);
});

test("Roster access control: handles whitespace and empty allowlist cleanly", () => {
  process.env.ROSTER_ENABLED = "false";
  process.env.ROSTER_ALLOWLIST_USER_IDS = "  ,  , ";

  assert.equal(rosterAllowlistUserIds().size, 0);
  assert.equal(canAccessRoster({ userId: "user_owner_123" }), false);
});
