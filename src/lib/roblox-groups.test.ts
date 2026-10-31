import { test } from "node:test";
import assert from "node:assert/strict";
import { FakeRobloxGroupsClient } from "./roblox-groups";

test("Roblox group client: fetches details, roles, and members for verified group", async () => {
  const fake = new FakeRobloxGroupsClient();
  fake.groups.set(123456, {
    id: 123456,
    name: "Redwood County Studios",
    description: "Official development group",
    owner: { id: 98765432, username: "LeadDeveloper" },
    memberCount: 1420,
  });

  fake.roles.set(123456, [
    { id: 1, name: "Member", rank: 1 },
    { id: 2, name: "Moderator", rank: 100 },
    { id: 3, name: "Owner", rank: 255 },
  ]);

  fake.members.set(123456, [
    {
      user: { userId: 98765432, username: "LeadDeveloper", displayName: "Lead" },
      role: { id: 3, name: "Owner", rank: 255 },
    },
    {
      user: { userId: 55555555, username: "ModAlpha", displayName: "Alpha" },
      role: { id: 2, name: "Moderator", rank: 100 },
    },
  ]);

  fake.userRanks.set("98765432_123456", 255);
  fake.userRanks.set("55555555_123456", 100);

  const details = await fake.getGroupDetails(123456);
  assert.equal(details?.name, "Redwood County Studios");
  assert.equal(details?.owner?.id, 98765432);

  const roles = await fake.getGroupRoles(123456);
  assert.equal(roles.length, 3);

  const members = await fake.getGroupMembers(123456);
  assert.equal(members.length, 2);

  const rank = await fake.getUserGroupRank(98765432, 123456);
  assert.equal(rank, 255);
});

test("Roblox group client: handles rate limiting gracefully without crashing", async () => {
  const fake = new FakeRobloxGroupsClient();
  fake.rateLimitNext = true;

  await assert.rejects(
    async () => {
      await fake.getGroupDetails(123456);
    },
    { message: /429 Too Many Requests/ }
  );

  const roles = await fake.getGroupRoles(123456);
  assert.deepEqual(roles, []);
});

test("Roblox group client: handles service outage gracefully", async () => {
  const fake = new FakeRobloxGroupsClient();
  fake.outageNext = true;

  await assert.rejects(
    async () => {
      await fake.getGroupDetails(123456);
    },
    { message: /503/ }
  );
});
