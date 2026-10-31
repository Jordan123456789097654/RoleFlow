import { test } from "node:test";
import assert from "node:assert/strict";
import { previewRobloxGroup } from "./roster-group-service";
import { FakeRobloxGroupsClient } from "./roblox-groups";

test("previewRobloxGroup: verifies manager authority and returns full preview without committing", async () => {
  const fake = new FakeRobloxGroupsClient();
  fake.groups.set(999, {
    id: 999,
    name: "Pacific Ridge Patrol",
    description: "Public Safety Roblox Group",
    owner: { id: 777777, username: "PoliceChief" },
    memberCount: 500,
  });

  fake.roles.set(999, [
    { id: 1, name: "Officer", rank: 10 },
    { id: 2, name: "Captain", rank: 210 },
    { id: 3, name: "Chief", rank: 255 },
  ]);

  fake.members.set(999, [
    {
      user: { userId: 111, username: "CadetOne", displayName: "Cadet" },
      role: { id: 1, name: "Officer", rank: 10 },
    },
  ]);

  // Case A: User has rank 210 (Manager) -> Eligible
  fake.userRanks.set("777777_999", 255);
  fake.userRanks.set("222222_999", 210);

  const resManager = await previewRobloxGroup(
    {
      userId: "user_manager_1",
      userRobloxId: "222222",
      robloxGroupId: "999",
    },
    fake
  );

  assert.equal(resManager.eligible, true);
  assert.equal(resManager.groupName, "Pacific Ridge Patrol");
  assert.equal(resManager.roles.length, 3);
  assert.equal(resManager.membersPreview.length, 1);

  // Case B: User has rank 10 (Ordinary member) -> Ineligible
  fake.userRanks.set("333333_999", 10);
  const resMember = await previewRobloxGroup(
    {
      userId: "user_member_1",
      userRobloxId: "333333",
      robloxGroupId: "999",
    },
    fake
  );

  assert.equal(resMember.eligible, false);
  assert.match(resMember.error || "", /Rank >= 200/);
});

test("previewRobloxGroup: recognizes owner with userId or username even if rank is low", async () => {
  const fake = new FakeRobloxGroupsClient();
  fake.groups.set(14910342, {
    id: 14910342,
    name: "[WPS] Willowbrook Primary School",
    description: "Primary school",
    owner: { userId: 10434324980, username: "JordanDanielsGames" },
    memberCount: 30,
  });
  fake.roles.set(14910342, [
    { id: 1, name: "Member", rank: 1 },
    { id: 784461015, name: "Governing Body", rank: 20 },
  ]);
  fake.members.set(14910342, []);
  fake.userRanks.set("10434324980_14910342", 20);

  const res = await previewRobloxGroup(
    {
      userId: "u_owner",
      userRobloxId: "10434324980",
      userRobloxUsername: "JordanDanielsGames",
      robloxGroupId: "14910342",
    },
    fake
  );

  assert.equal(res.eligible, true);
  assert.equal(res.groupName, "[WPS] Willowbrook Primary School");
});

test("previewRobloxGroup: handles non-existent group cleanly", async () => {
  const fake = new FakeRobloxGroupsClient();
  const res = await previewRobloxGroup(
    {
      userId: "u1",
      userRobloxId: "123",
      robloxGroupId: "404",
    },
    fake
  );

  assert.equal(res.eligible, false);
  assert.match(res.error || "", /not found/i);
});
