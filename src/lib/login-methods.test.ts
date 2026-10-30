import { test } from "node:test";
import assert from "node:assert/strict";
import { canUnlinkMethod } from "./login-methods";

test("allows unlinking discord when password is also linked", () => {
  const result = canUnlinkMethod({ hasDiscord: true, hasPassword: true }, "discord");
  assert.equal(result.canUnlink, true);
  assert.equal(result.error, undefined);
});

test("blocks unlinking discord when it is the only login method", () => {
  const result = canUnlinkMethod({ hasDiscord: true, hasPassword: false }, "discord");
  assert.equal(result.canUnlink, false);
  assert.match(result.error || "", /must set a password first/i);
});

test("allows unlinking password when discord is also linked", () => {
  const result = canUnlinkMethod({ hasDiscord: true, hasPassword: true }, "password");
  assert.equal(result.canUnlink, true);
  assert.equal(result.error, undefined);
});

test("blocks unlinking password when it is the only login method", () => {
  const result = canUnlinkMethod({ hasDiscord: false, hasPassword: true }, "password");
  assert.equal(result.canUnlink, false);
  assert.match(result.error || "", /must link Discord first/i);
});

test("blocks unlinking method that is not active", () => {
  const result = canUnlinkMethod({ hasDiscord: true, hasPassword: false }, "password");
  assert.equal(result.canUnlink, false);
  assert.match(result.error || "", /Password is not set/i);
});
