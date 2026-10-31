import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptVaultSecret, decryptVaultSecret } from "./vault";
import {
  validateSafetyGuards,
  buildOpenCloudRankPayload,
  RobloxRanker,
} from "./roblox-ranker";

// Set required secret for vault encryption tests
process.env.APP_SECRET = "test-secret-long-enough-32-bytes-key-roleflow";

test("Vault: encrypts and decrypts secret in roundtrip", () => {
  const secret = "secret_open_cloud_api_key_12345!@#$%^&*()";
  const encrypted = encryptVaultSecret(secret);

  assert.notEqual(encrypted, secret);
  assert.ok(encrypted.startsWith("enc:v1:"), "Should start with enc:v1: prefix");

  const decrypted = decryptVaultSecret(encrypted);
  assert.equal(decrypted, secret, "Decrypted secret should match original");

  // Idempotency: encrypting already encrypted value returns same value
  assert.equal(encryptVaultSecret(encrypted), encrypted);

  // Decrypting null / empty string
  assert.equal(decryptVaultSecret(null), "");
  assert.equal(decryptVaultSecret(""), "");
});

test("Vault: decrypts legacy plaintext without error", () => {
  const legacy = "legacy_plaintext_cookie_value";
  assert.equal(decryptVaultSecret(legacy), legacy);
});

test("Safety Guards: allows ranking below or equal to rank ceiling", () => {
  const target = {
    currentRank: 10,
    targetRank: 50,
  };
  const result = validateSafetyGuards(target, { rankCeiling: 100 });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, undefined);
});

test("Safety Guards: rejects ranking targetRank above rank ceiling", () => {
  const target = {
    currentRank: 50,
    targetRank: 255,
  };
  const result = validateSafetyGuards(target, { rankCeiling: 254 });
  assert.equal(result.allowed, false);
  assert.match(result.reason || "", /exceeds configured rank ceiling/i);
});

test("Safety Guards: rejects modifying a member whose current rank exceeds rank ceiling", () => {
  const target = {
    currentRank: 255, // Owner
    targetRank: 50,
  };
  const result = validateSafetyGuards(target, { rankCeiling: 250 });
  assert.equal(result.allowed, false);
  assert.match(result.reason || "", /exceeds rank ceiling/i);
});

test("Safety Guards: rejects modifying users in protected roles", () => {
  // Target rank is protected
  const resTargetProtected = validateSafetyGuards(
    { currentRank: 10, targetRank: 200 },
    { rankCeiling: 254, protectedRoles: ["200", "255"] }
  );
  assert.equal(resTargetProtected.allowed, false);
  assert.match(resTargetProtected.reason || "", /in the protected roles list/i);

  // Current user rank is protected
  const resCurrentProtected = validateSafetyGuards(
    { currentRank: 200, targetRank: 50 },
    { rankCeiling: 254, protectedRoles: [200, 255] }
  );
  assert.equal(resCurrentProtected.allowed, false);
  assert.match(resCurrentProtected.reason || "", /currently in a protected role/i);
});

test("Safety Guards: prevents demotions when allowDemotions is false", () => {
  const demotion = validateSafetyGuards(
    { currentRank: 100, targetRank: 50 },
    { rankCeiling: 254, allowDemotions: false }
  );
  assert.equal(demotion.allowed, false);
  assert.match(demotion.reason || "", /demotions are disabled/i);

  // Promotion is permitted when allowDemotions is false
  const promotion = validateSafetyGuards(
    { currentRank: 50, targetRank: 100 },
    { rankCeiling: 254, allowDemotions: false }
  );
  assert.equal(promotion.allowed, true);
});

test("Open Cloud: prepares membership payload and URL correctly", () => {
  const groupId = "12345678";
  const userId = "987654321";
  const targetRoleId = "44445555";
  const apiKey = "mock-cloud-api-key-test";

  const payload = buildOpenCloudRankPayload(groupId, userId, targetRoleId);

  assert.equal(
    payload.url,
    "https://apis.roblox.com/cloud/v2/groups/12345678/memberships/987654321?updateMask=role"
  );
  assert.equal(payload.method, "PATCH");

  const headers = payload.headers(apiKey);
  assert.equal(headers["x-api-key"], apiKey);
  assert.equal(headers["Content-Type"], "application/json");

  assert.deepEqual(payload.body, {
    role: "groups/12345678/roles/44445555",
  });
});

test("RobloxRanker: simulateRank respects safety ceiling and protected guards", async () => {
  const ranker = new RobloxRanker({
    groupId: "12345678",
    authType: "OPEN_CLOUD",
    rankCeiling: 200,
    protectedRoles: ["150"],
    allowDemotions: false,
  });

  // Ceiling violation simulation
  const ceilSim = await ranker.simulateRank({
    robloxUserId: "1001",
    currentRankId: 50,
    targetRankId: 205,
    targetRoleId: 9999,
  });
  assert.equal(ceilSim.success, false);
  assert.equal(ceilSim.simulated, true);
  assert.match(ceilSim.error || "", /exceeds configured rank ceiling/i);

  // Protected role violation simulation
  const protSim = await ranker.simulateRank({
    robloxUserId: "1002",
    currentRankId: 150,
    targetRankId: 100,
    targetRoleId: 9998,
  });
  assert.equal(protSim.success, false);
  assert.equal(protSim.simulated, true);
  assert.match(protSim.error || "", /protected/i);

  // Demotion blocked simulation
  const demoteSim = await ranker.simulateRank({
    robloxUserId: "1003",
    currentRankId: 100,
    targetRankId: 50,
    targetRoleId: 9997,
  });
  assert.equal(demoteSim.success, false);
  assert.equal(demoteSim.simulated, true);
  assert.match(demoteSim.error || "", /demotions are disabled/i);

  // Valid simulation
  const validSim = await ranker.simulateRank({
    robloxUserId: "1004",
    currentRankId: 10,
    targetRankId: 50,
    targetRoleId: 9996,
  });
  assert.equal(validSim.success, true);
  assert.equal(validSim.simulated, true);
  assert.equal(validSim.newRankId, 50);
  assert.equal(validSim.targetRoleId, 9996);
});
