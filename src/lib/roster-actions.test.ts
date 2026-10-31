import { test } from "node:test";
import assert from "node:assert/strict";
import { hasRosterPermission } from "./roster-permissions";

test("Moderation action permission: logging and viewing capabilities", () => {
  // Staff cannot log actions
  assert.equal(hasRosterPermission("STAFF", "action.log"), false);

  // Moderator, Manager, and Owner can log actions
  assert.equal(hasRosterPermission("MODERATOR", "action.log"), true);
  assert.equal(hasRosterPermission("MANAGER", "action.log"), true);
  assert.equal(hasRosterPermission("OWNER", "action.log"), true);

  // Only Manager and Owner can export CSV
  assert.equal(hasRosterPermission("STAFF", "action.export_csv"), false);
  assert.equal(hasRosterPermission("MODERATOR", "action.export_csv"), false);
  assert.equal(hasRosterPermission("MANAGER", "action.export_csv"), true);
  assert.equal(hasRosterPermission("OWNER", "action.export_csv"), true);
});

test("Moderation action permission: 24-hour edit restriction", () => {
  const actorId = "usr_author";

  // Author within 24 hours (e.g. 120 minutes ago)
  assert.equal(
    hasRosterPermission("MODERATOR", "action.edit_own", {
      actorUserId: actorId,
      authorUserId: actorId,
      createdMinutesAgo: 120,
    }),
    true
  );

  // Author after 24 hours (e.g. 1441 minutes ago) -> Read-only
  assert.equal(
    hasRosterPermission("MODERATOR", "action.edit_own", {
      actorUserId: actorId,
      authorUserId: actorId,
      createdMinutesAgo: 1441,
    }),
    false,
    "Actions must become strictly read-only after 24 hours"
  );

  // Non-author attempting to edit within 24 hours -> Rejected
  assert.equal(
    hasRosterPermission("MODERATOR", "action.edit_own", {
      actorUserId: "usr_different",
      authorUserId: actorId,
      createdMinutesAgo: 60,
    }),
    false,
    "Non-authors cannot edit actions"
  );
});
