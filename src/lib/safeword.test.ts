import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSafeword } from "./safeword";

test("generateSafeword: generates 5-segment safeword matching roleflow pattern", () => {
  const safeword = generateSafeword();
  assert.ok(safeword.startsWith("roleflow-"));

  const parts = safeword.split("-");
  // roleflow - word1 - word2 - word3 - num
  assert.equal(parts.length, 5, `Expected 5 segments but got: ${safeword}`);
  assert.equal(parts[0], "roleflow");
  assert.match(parts[4], /^\d{4}$/, "Last segment must be 4-digit number");

  // Distinct words
  const words = [parts[1], parts[2], parts[3]];
  const uniqueWords = new Set(words);
  assert.equal(uniqueWords.size, 3, "Expected 3 distinct words");
});

test("generateSafeword: produces unique phrases on subsequent invocations", () => {
  const set = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const sw = generateSafeword();
    set.add(sw);
  }
  assert.equal(set.size, 50, "All generated safewords should be unique");
});
