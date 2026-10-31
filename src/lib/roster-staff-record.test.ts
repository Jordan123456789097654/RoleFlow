import { test } from "node:test";
import assert from "node:assert/strict";
import { hasRosterPermission } from "./roster-permissions";

test("Permission verification: Staff record viewing restrictions", () => {
  // Staff member cannot view other members' records
  assert.equal(
    hasRosterPermission("STAFF", "staff.view_record", { isTargetSelf: false }),
    false,
    "STAFF role must NOT be allowed to view another member's staff record"
  );

  // Staff member CAN view their own record
  assert.equal(
    hasRosterPermission("STAFF", "staff.view_record", { isTargetSelf: true }),
    true,
    "STAFF role MUST be allowed to view their own staff record"
  );

  // Moderator can view any member's staff record
  assert.equal(
    hasRosterPermission("MODERATOR", "staff.view_record", { isTargetSelf: false }),
    true,
    "MODERATOR role can view records"
  );

  // Moderator CANNOT edit staff records
  assert.equal(
    hasRosterPermission("MODERATOR", "staff.edit_record"),
    false,
    "MODERATOR role must NOT be allowed to edit staff records"
  );

  // Manager and Owner CAN edit staff records
  assert.equal(hasRosterPermission("MANAGER", "staff.edit_record"), true);
  assert.equal(hasRosterPermission("OWNER", "staff.edit_record"), true);
});
