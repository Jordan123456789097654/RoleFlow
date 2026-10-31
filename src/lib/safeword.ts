import { randomInt } from "crypto";

const WORDS = [
  "falcon",
  "timber",
  "echo",
  "river",
  "summit",
  "cedar",
  "shadow",
  "blaze",
  "harbor",
  "meadow",
  "canyon",
  "breeze",
  "shield",
  "anchor",
  "frost",
  "beacon",
  "orbit",
  "vertex",
  "pulse",
  "matrix",
];

/**
 * Generates a 5-safeword phrase formatted like: `roleflow-falcon-timber-echo-4912`
 * - Prefix: `roleflow`
 * - 3 random descriptive words
 * - 1 4-digit number (1000 - 9999)
 */
export function generateSafeword(): string {
  const selected: string[] = [];
  while (selected.length < 3) {
    const idx = randomInt(0, WORDS.length);
    const word = WORDS[idx];
    if (!selected.includes(word)) {
      selected.push(word);
    }
  }

  const num = randomInt(1000, 10000);
  return `roleflow-${selected.join("-")}-${num}`;
}
