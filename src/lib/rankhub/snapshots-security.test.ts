import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateSnapshotDiff,
  SnapshotMember,
  createSnapshot,
  restoreSnapshot,
} from "./snapshots";
import {
  checkAntiNukeRate,
  triggerSecurityLockdown,
  unlockSecurity,
  resetAntiNukeMemoryState,
} from "./anti-nuke";

test("Snapshots Diff: accurately identifies promotions, demotions, and noops", () => {
  const currentMembers: SnapshotMember[] = [
    { robloxUserId: "101", username: "Alice", roleId: 10, rank: 10, roleName: "Guest" },
    { robloxUserId: "102", username: "Bob", roleId: 20, rank: 50, roleName: "Officer" },
    { robloxUserId: "103", username: "Charlie", roleId: 30, rank: 100, roleName: "Captain" },
  ];

  const snapshotMembers: SnapshotMember[] = [
    // Alice was Captain (100) in backup, currently Guest (10) -> Needs PROMOTE
    { robloxUserId: "101", username: "Alice", roleId: 30, rank: 100, roleName: "Captain" },
    // Bob was Officer (50) in backup, currently Officer (50) -> NOOP
    { robloxUserId: "102", username: "Bob", roleId: 20, rank: 50, roleName: "Officer" },
    // Charlie was Guest (10) in backup, currently Captain (100) -> Needs DEMOTE
    { robloxUserId: "103", username: "Charlie", roleId: 10, rank: 10, roleName: "Guest" },
  ];

  const diffs = calculateSnapshotDiff(currentMembers, snapshotMembers, { rankCeiling: 254 });

  const aliceDiff = diffs.find((d) => d.robloxUserId === "101");
  assert.ok(aliceDiff);
  assert.equal(aliceDiff.needsUpdate, true);
  assert.equal(aliceDiff.action, "PROMOTE");
  assert.equal(aliceDiff.snapshotRank, 100);
  assert.equal(aliceDiff.blockedBySafety, false);

  const bobDiff = diffs.find((d) => d.robloxUserId === "102");
  assert.ok(bobDiff);
  assert.equal(bobDiff.needsUpdate, false);
  assert.equal(bobDiff.action, "NOOP");

  const charlieDiff = diffs.find((d) => d.robloxUserId === "103");
  assert.ok(charlieDiff);
  assert.equal(charlieDiff.needsUpdate, true);
  assert.equal(charlieDiff.action, "DEMOTE");
  assert.equal(charlieDiff.snapshotRank, 10);
  assert.equal(charlieDiff.blockedBySafety, false);
});

test("Snapshots Diff: enforces safety ceiling and blocks dangerous role mutations", () => {
  const currentMembers: SnapshotMember[] = [
    { robloxUserId: "999", username: "RogueTarget", roleId: 10, rank: 10, roleName: "Guest" },
  ];

  const snapshotMembers: SnapshotMember[] = [
    // Snapshot wants to restore them to Owner rank 255, but ceiling is 250
    { robloxUserId: "999", username: "RogueTarget", roleId: 99, rank: 255, roleName: "Group Owner" },
  ];

  const diffs = calculateSnapshotDiff(currentMembers, snapshotMembers, {
    rankCeiling: 250,
    protectedRoles: [255],
  });

  const rogueDiff = diffs.find((d) => d.robloxUserId === "999");
  assert.ok(rogueDiff);
  assert.equal(rogueDiff.needsUpdate, true);
  assert.equal(rogueDiff.blockedBySafety, true);
  assert.match(rogueDiff.safetyReason || "", /exceeds configured rank ceiling/i);
});

test("Anti-Nuke: sliding 60-second window detects breach when demotions exceed threshold", async () => {
  resetAntiNukeMemoryState();

  const testGroupId = "anti-nuke-test-group-1";
  const executorId = "rogue-admin-discord-id";
  const maxThreshold = 3;

  // 1st demotion: allowed
  const r1 = await checkAntiNukeRate(testGroupId, executorId, "DEMOTE", 60, maxThreshold);
  assert.equal(r1.allowed, true);
  assert.equal(r1.isBreached, false);
  assert.equal(r1.actionCountInWindow, 1);

  // 2nd demotion: allowed
  const r2 = await checkAntiNukeRate(testGroupId, executorId, "DEMOTE", 60, maxThreshold);
  assert.equal(r2.allowed, true);
  assert.equal(r2.isBreached, false);
  assert.equal(r2.actionCountInWindow, 2);

  // 3rd demotion: allowed (at threshold)
  const r3 = await checkAntiNukeRate(testGroupId, executorId, "DEMOTE", 60, maxThreshold);
  assert.equal(r3.allowed, true);
  assert.equal(r3.isBreached, false);
  assert.equal(r3.actionCountInWindow, 3);

  // 4th demotion: BREACH! (exceeds threshold of 3/min)
  const r4 = await checkAntiNukeRate(testGroupId, executorId, "DEMOTE", 60, maxThreshold);
  assert.equal(r4.allowed, false);
  assert.equal(r4.isBreached, true);
  assert.match(r4.reason || "", /Anti-Nuke Triggered/i);
});

test("Anti-Nuke: lockdown freezes all ranking and 1-click unlock restores NORMAL state", async () => {
  resetAntiNukeMemoryState();

  const testGroupId = "lockdown-test-group-2";

  // Trigger lockdown
  const lockResult = await triggerSecurityLockdown(testGroupId, "Emergency anti-nuke test breach");
  assert.equal(lockResult.status, "LOCKED");

  // While locked, checkAntiNukeRate must block actions
  const rateCheck = await checkAntiNukeRate(testGroupId, "anyone", "DEMOTE", 60, 5);
  assert.equal(rateCheck.allowed, false);
  assert.equal(rateCheck.isBreached, true);
  assert.match(rateCheck.reason || "", /LOCKED/i);

  // 1-Click unlock
  const unlockResult = await unlockSecurity(testGroupId, "community-owner-discord-id");
  assert.equal(unlockResult.status, "NORMAL");

  // After unlock, normal actions are permitted again
  const postUnlockRate = await checkAntiNukeRate(testGroupId, "legit-officer", "DEMOTE", 60, 5);
  assert.equal(postUnlockRate.allowed, true);
  assert.equal(postUnlockRate.isBreached, false);
});
