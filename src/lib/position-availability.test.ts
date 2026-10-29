import { test } from "node:test";
import assert from "node:assert/strict";
import { availabilityOf } from "./position-availability";

const now = new Date("2026-10-29T12:00:00Z");
const hours = (h: number) => new Date(now.getTime() + h * 3_600_000);

test("open with no schedule", () => {
  assert.deepEqual(availabilityOf({ isOpen: true }, now), { open: true });
});

test("closed when manually closed", () => {
  assert.equal(availabilityOf({ isOpen: false }, now).open, false);
});

test("not yet open before opensAt", () => {
  const r = availabilityOf({ isOpen: true, opensAt: hours(2) }, now);
  assert.equal(r.open, false);
});

test("open between opensAt and closesAt", () => {
  assert.equal(availabilityOf({ isOpen: true, opensAt: hours(-1), closesAt: hours(1) }, now).open, true);
});

test("closed at or after closesAt", () => {
  assert.equal(availabilityOf({ isOpen: true, closesAt: hours(0) }, now).open, false);
  assert.equal(availabilityOf({ isOpen: true, closesAt: hours(-1) }, now).open, false);
});
