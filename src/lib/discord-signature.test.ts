import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "crypto";
import { validSignature } from "./discord-signature";

const pair = generateKeyPairSync("ed25519");
const publicKeyHex = pair.publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
const other = generateKeyPairSync("ed25519");

function sigFor(body: string, ts: string, key = pair.privateKey) {
  return sign(null, Buffer.from(ts + body), key).toString("hex");
}

const body = JSON.stringify({ type: 1 });
const ts = "1700000000";

test("accepts a request signed by the bot's key", () => {
  assert.equal(validSignature(body, publicKeyHex, sigFor(body, ts), ts), true);
});

test("rejects a changed body", () => {
  assert.equal(validSignature(body + " ", publicKeyHex, sigFor(body, ts), ts), false);
});

test("rejects a changed timestamp", () => {
  assert.equal(validSignature(body, publicKeyHex, sigFor(body, ts), "1700000001"), false);
});

test("rejects a signature from a different key", () => {
  assert.equal(validSignature(body, publicKeyHex, sigFor(body, ts, other.privateKey), ts), false);
});

test("rejects missing headers or key", () => {
  assert.equal(validSignature(body, null, sigFor(body, ts), ts), false);
  assert.equal(validSignature(body, publicKeyHex, null, ts), false);
  assert.equal(validSignature(body, publicKeyHex, sigFor(body, ts), null), false);
});

test("rejects malformed hex without throwing", () => {
  assert.equal(validSignature(body, "not-hex", "zz", ts), false);
});
