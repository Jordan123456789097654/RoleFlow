import { test } from "node:test";
import assert from "node:assert/strict";

process.env.APP_SECRET = "test-secret-at-least-16-chars";
const { signToken, verifyToken, safeRelativePath } = await import("./signed-token");

test("token round-trips its data for the same purpose", () => {
  const t = signToken("appeal", { p: "pun_1" }, 60);
  assert.deepEqual(verifyToken<{ p: string }>("appeal", t), { p: "pun_1" });
});

test("token is rejected for a different purpose", () => {
  const t = signToken("appeal", { p: "pun_1" }, 60);
  assert.equal(verifyToken("bridge", t), null);
});

test("expired token is rejected", () => {
  const t = signToken("appeal", { p: "pun_1" }, -1);
  assert.equal(verifyToken("appeal", t), null);
});

test("tampered payload is rejected", () => {
  const t = signToken("appeal", { p: "pun_1" }, 60);
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ d: { p: "pun_2" }, e: 9999999999 })).toString("base64url");
  assert.equal(verifyToken("appeal", `${forged}.${sig}`), null);
  assert.equal(verifyToken("appeal", `${body}.bogus`), null);
});

test("missing or malformed tokens are rejected", () => {
  assert.equal(verifyToken("appeal", undefined), null);
  assert.equal(verifyToken("appeal", ""), null);
  assert.equal(verifyToken("appeal", "no-dot-here"), null);
});

test("signing fails closed without a strong secret", () => {
  const saved = process.env.APP_SECRET;
  process.env.APP_SECRET = "short";
  assert.throws(() => signToken("appeal", { p: "x" }, 60));
  assert.equal(verifyToken("appeal", "abc.def"), null);
  process.env.APP_SECRET = saved;
});

test("safeRelativePath keeps same-site paths", () => {
  assert.equal(safeRelativePath("/dashboard?x=1", "https://roleflow.site"), "/dashboard?x=1");
});

test("safeRelativePath blocks open-redirect tricks", () => {
  const o = "https://roleflow.site";
  assert.equal(safeRelativePath("//evil.com", o), "/");
  assert.equal(safeRelativePath("/\\evil.com", o), "/");
  assert.equal(safeRelativePath("https://evil.com", o), "/");
  assert.equal(safeRelativePath("/\u0009/evil.com", o), "/");
  assert.equal(safeRelativePath(null, o), "/");
});
