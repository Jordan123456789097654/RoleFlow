import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateStaffActivity } from "./roster-activity";

test("calculateStaffActivity: aggregates counts within 7, 30, and 90 day windows", () => {
  const now = new Date("2026-10-30T12:00:00Z");
  const staffIds = ["101", "102"];

  const events = {
    shifts: [
      // Within 7 days
      { robloxUserId: "101", closedAt: "2026-10-28T12:00:00Z" },
      { robloxUserId: "101", closedAt: "2026-10-25T12:00:00Z" },
      // Within 30 days (15 days ago)
      { robloxUserId: "101", closedAt: "2026-10-15T12:00:00Z" },
      // Within 90 days (60 days ago)
      { robloxUserId: "101", closedAt: "2026-08-30T12:00:00Z" },
      // Unclosed shift (must be ignored)
      { robloxUserId: "101", closedAt: null },
      // Different user
      { robloxUserId: "102", closedAt: "2026-10-29T12:00:00Z" },
    ],
    trainings: [
      // 101 completed within 7 days
      { robloxUserId: "101", completed: true, completedAt: "2026-10-27T10:00:00Z" },
      // 101 attended but not completed (must be ignored)
      { robloxUserId: "101", completed: false, completedAt: null },
      // 102 completed 20 days ago
      { robloxUserId: "102", completed: true, completedAt: "2026-10-10T10:00:00Z" },
    ],
    actions: [
      // 101 targeted within 7 days
      { targetRobloxUserId: "101", createdAt: "2026-10-29T15:00:00Z" },
      // 102 targeted 45 days ago
      { targetRobloxUserId: "102", createdAt: "2026-09-15T15:00:00Z" },
    ],
  };

  // 7-day window
  const summary7 = calculateStaffActivity(staffIds, events, 7, now);
  const u101_7 = summary7.get("101")!;
  assert.equal(u101_7.shiftsCompleted, 2);
  assert.equal(u101_7.trainingsCompleted, 1);
  assert.equal(u101_7.actionsLoggedOrTargeted, 1);

  // 30-day window
  const summary30 = calculateStaffActivity(staffIds, events, 30, now);
  const u101_30 = summary30.get("101")!;
  assert.equal(u101_30.shiftsCompleted, 3);
  assert.equal(u101_30.trainingsCompleted, 1);

  // 90-day window
  const summary90 = calculateStaffActivity(staffIds, events, 90, now);
  const u101_90 = summary90.get("101")!;
  assert.equal(u101_90.shiftsCompleted, 4);

  const u102_90 = summary90.get("102")!;
  assert.equal(u102_90.shiftsCompleted, 1);
  assert.equal(u102_90.trainingsCompleted, 1);
  assert.equal(u102_90.actionsLoggedOrTargeted, 1);
});
