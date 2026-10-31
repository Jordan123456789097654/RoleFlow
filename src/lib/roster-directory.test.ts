import { test } from "node:test";
import assert from "node:assert/strict";
import { filterAndSortRoster, type StaffDirectoryItem } from "./roster-directory";

const SAMPLE_STAFF: StaffDirectoryItem[] = [
  {
    robloxUserId: "101",
    username: "AliceMod",
    avatarUrl: "https://example.com/alice.png",
    rank: "Moderator",
    rankId: 100,
    role: "MODERATOR",
    status: "ACTIVE",
    teams: [{ id: "t1", name: "Support" }],
    joinedAt: "2026-01-01T00:00:00Z",
    lastActivity: "2026-10-30T10:00:00Z",
    shiftsCount: 12,
    trainingsCount: 3,
    actionsCount: 20,
  },
  {
    robloxUserId: "102",
    username: "BobAdmin",
    avatarUrl: "https://example.com/bob.png",
    rank: "Administrator",
    rankId: 200,
    role: "MANAGER",
    status: "ACTIVE",
    teams: [{ id: "t2", name: "Executive" }],
    joinedAt: "2025-06-01T00:00:00Z",
    lastActivity: "2026-10-29T12:00:00Z",
    shiftsCount: 40,
    trainingsCount: 5,
    actionsCount: 85,
  },
  {
    robloxUserId: "103",
    username: "CharlieTrial",
    avatarUrl: "https://example.com/charlie.png",
    rank: "Trial Mod",
    rankId: 50,
    role: "STAFF",
    status: "INACTIVE",
    teams: [{ id: "t1", name: "Support" }],
    joinedAt: "2026-09-01T00:00:00Z",
    lastActivity: null,
    shiftsCount: 1,
    trainingsCount: 1,
    actionsCount: 0,
  },
  {
    robloxUserId: "104",
    username: "DaveOwner",
    avatarUrl: "https://example.com/dave.png",
    rank: "Owner",
    rankId: 255,
    role: "OWNER",
    status: "ACTIVE",
    teams: [],
    joinedAt: "2024-01-01T00:00:00Z",
    lastActivity: "2026-10-30T18:00:00Z",
    shiftsCount: 10,
    trainingsCount: 0,
    actionsCount: 5,
  },
];

test("filterAndSortRoster: searches by username case-insensitively", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { search: "alice" });
  assert.equal(res.length, 1);
  assert.equal(res[0].username, "AliceMod");
});

test("filterAndSortRoster: searches by robloxUserId", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { search: "103" });
  assert.equal(res.length, 1);
  assert.equal(res[0].username, "CharlieTrial");
});

test("filterAndSortRoster: filters by rank", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { rank: "Administrator" });
  assert.equal(res.length, 1);
  assert.equal(res[0].username, "BobAdmin");
});

test("filterAndSortRoster: filters by team", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { teamId: "t1" });
  assert.equal(res.length, 2);
  const names = res.map((r) => r.username).sort();
  assert.deepEqual(names, ["AliceMod", "CharlieTrial"]);
});

test("filterAndSortRoster: filters by status", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { status: "INACTIVE" });
  assert.equal(res.length, 1);
  assert.equal(res[0].username, "CharlieTrial");
});

test("filterAndSortRoster: sorts by rank desc (default)", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { sortBy: "rank", sortOrder: "desc" });
  assert.equal(res[0].username, "DaveOwner"); // 255
  assert.equal(res[1].username, "BobAdmin");  // 200
  assert.equal(res[2].username, "AliceMod");  // 100
  assert.equal(res[3].username, "CharlieTrial"); // 50
});

test("filterAndSortRoster: sorts by name asc", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { sortBy: "name", sortOrder: "asc" });
  assert.equal(res[0].username, "AliceMod");
  assert.equal(res[1].username, "BobAdmin");
  assert.equal(res[2].username, "CharlieTrial");
  assert.equal(res[3].username, "DaveOwner");
});

test("filterAndSortRoster: sorts by lastActivity desc with nulls last", () => {
  const res = filterAndSortRoster(SAMPLE_STAFF, { sortBy: "lastActivity", sortOrder: "desc" });
  assert.equal(res[0].username, "DaveOwner"); // 18:00
  assert.equal(res[1].username, "AliceMod");  // 10:00
  assert.equal(res[2].username, "BobAdmin");  // Oct 29
  assert.equal(res[3].username, "CharlieTrial"); // null
});
