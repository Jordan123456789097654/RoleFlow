import { test } from "node:test";
import assert from "node:assert/strict";
import { exportActionsToCSV, escapeCSVCell } from "./roster-actions-csv";

test("escapeCSVCell: escapes quotes and commas cleanly", () => {
  assert.equal(escapeCSVCell("simple"), '"simple"');
  assert.equal(escapeCSVCell('with "quotes" and , commas'), '"with ""quotes"" and , commas"');
  assert.equal(escapeCSVCell(null), '""');
  assert.equal(escapeCSVCell(120), '"120"');
});

test("exportActionsToCSV: formats records with standard headers and linebreaks", () => {
  const csv = exportActionsToCSV([
    {
      id: "act_1",
      type: "WARNING",
      targetRobloxUserId: "123456",
      actorUsername: "LeadMod",
      reason: "Disruptive behavior in group wall",
      durationMinutes: null,
      createdAt: "2026-10-30T12:00:00Z",
      editedAt: null,
    },
    {
      id: "act_2",
      type: "SUSPENSION",
      targetRobloxUserId: "999888",
      actorUsername: "OwnerBob",
      reason: "Inactivity, unexcused",
      durationMinutes: 1440,
      createdAt: "2026-10-29T10:00:00Z",
      editedAt: "2026-10-29T11:00:00Z",
    },
  ]);

  const lines = csv.split("\r\n");
  assert.equal(lines.length, 3);
  assert.ok(lines[0].includes("Action ID,Type,Target Roblox User ID"));
  assert.ok(lines[1].includes('"act_1","WARNING","123456","LeadMod"'));
  assert.ok(lines[2].includes('"act_2","SUSPENSION","999888","OwnerBob"'));
});
