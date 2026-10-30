import { test } from "node:test";
import assert from "node:assert/strict";
import { hasRosterPermission, getAllowedActionsForRole, RosterRole } from "./roster-permissions";

test("Roster permissions: OWNER has full control over all operations and lifecycle", () => {
  assert.equal(hasRosterPermission("OWNER", "group.delete"), true);
  assert.equal(hasRosterPermission("OWNER", "group.archive"), true);
  assert.equal(hasRosterPermission("OWNER", "roster.edit"), true);
  assert.equal(hasRosterPermission("OWNER", "roster.view_full"), true);
  assert.equal(hasRosterPermission("OWNER", "action.log"), true);
  assert.equal(hasRosterPermission("OWNER", "action.view_all"), true);
  assert.equal(hasRosterPermission("OWNER", "action.export_csv"), true);
  assert.equal(hasRosterPermission("OWNER", "shift.manage"), true);
  assert.equal(hasRosterPermission("OWNER", "training.manage"), true);
});

test("Roster permissions: MANAGER can manage roster and operations but CANNOT delete/archive group", () => {
  assert.equal(hasRosterPermission("MANAGER", "group.delete"), false);
  assert.equal(hasRosterPermission("MANAGER", "group.archive"), false);
  assert.equal(hasRosterPermission("MANAGER", "roster.edit"), true);
  assert.equal(hasRosterPermission("MANAGER", "roster.import_application"), true);
  assert.equal(hasRosterPermission("MANAGER", "action.view_all"), true);
  assert.equal(hasRosterPermission("MANAGER", "action.export_csv"), true);
  assert.equal(hasRosterPermission("MANAGER", "training.manage"), true);
  assert.equal(hasRosterPermission("MANAGER", "shift.manage"), true);
});

test("Roster permissions: MODERATOR can view roster and log actions, but CANNOT edit roster or delete", () => {
  assert.equal(hasRosterPermission("MODERATOR", "group.delete"), false);
  assert.equal(hasRosterPermission("MODERATOR", "roster.edit"), false);
  assert.equal(hasRosterPermission("MODERATOR", "roster.import_application"), false);
  assert.equal(hasRosterPermission("MODERATOR", "staff.edit_record"), false);
  assert.equal(hasRosterPermission("MODERATOR", "roster.view_full"), true);
  assert.equal(hasRosterPermission("MODERATOR", "action.log"), true);
  assert.equal(hasRosterPermission("MODERATOR", "action.view_all"), false);
  assert.equal(hasRosterPermission("MODERATOR", "action.export_csv"), false);
});

test("Roster permissions: STAFF cannot view full roster or edit records, only view their own record", () => {
  assert.equal(hasRosterPermission("STAFF", "roster.view_full"), false);
  assert.equal(hasRosterPermission("STAFF", "roster.edit"), false);
  assert.equal(hasRosterPermission("STAFF", "action.log"), false);
  assert.equal(hasRosterPermission("STAFF", "action.view_all"), false);

  // Viewing someone else's record: REFUSED
  assert.equal(hasRosterPermission("STAFF", "staff.view_record", { isTargetSelf: false }), false);

  // Viewing their own record: ALLOWED
  assert.equal(hasRosterPermission("STAFF", "staff.view_record", { isTargetSelf: true }), true);
});

test("Roster permissions: action.edit_own requires author identity and 24-hour window", () => {
  // Author editing within 2 hours: ALLOWED
  assert.equal(
    hasRosterPermission("MODERATOR", "action.edit_own", {
      actorUserId: "user_alice",
      authorUserId: "user_alice",
      createdMinutesAgo: 120,
    }),
    true
  );

  // Author editing after 25 hours (1500 minutes): REFUSED
  assert.equal(
    hasRosterPermission("MODERATOR", "action.edit_own", {
      actorUserId: "user_alice",
      authorUserId: "user_alice",
      createdMinutesAgo: 1500,
    }),
    false
  );

  // Non-author attempting to edit within 2 hours: REFUSED
  assert.equal(
    hasRosterPermission("MODERATOR", "action.edit_own", {
      actorUserId: "user_bob",
      authorUserId: "user_alice",
      createdMinutesAgo: 60,
    }),
    false
  );
});
