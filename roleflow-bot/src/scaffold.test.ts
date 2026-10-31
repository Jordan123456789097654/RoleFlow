import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBotConfig } from "./config";
import { isAuthorizedGuild, enforceGuildGuard, type GuildLike } from "./guard";

const VALID_ENV = {
  DISCORD_BOT_TOKEN: "bot-token-xyz-12345678",
  DISCORD_APP_ID: "111222333444555666",
  ROLEFLOW_SERVER_ID: "999888777666555444",
  VERIFY_CHANNEL_ID: "100200300400500600",
  STAFF_CHANNEL_ID: "100200300400500700",
  VERIFIED_ROLE_ID: "100200300400500800",
  ROLEFLOW_API_BASE: "https://applyhub.roleflow.site",
  BOT_API_SECRET: "my_super_secret_internal_key_32_chars",
};

test("parseBotConfig: successfully parses and normalizes valid environment", () => {
  const config = parseBotConfig(VALID_ENV);
  assert.equal(config.discordBotToken, "bot-token-xyz-12345678");
  assert.equal(config.roleflowServerId, "999888777666555444");
  assert.equal(config.roleflowApiBase, "https://applyhub.roleflow.site");
  assert.equal(config.botApiSecret, "my_super_secret_internal_key_32_chars");
});

test("parseBotConfig: rejects when required keys are missing", () => {
  assert.throws(() => {
    parseBotConfig({ ...VALID_ENV, DISCORD_BOT_TOKEN: "" });
  }, /Missing required environment variables for roleflow-bot: DISCORD_BOT_TOKEN/);

  assert.throws(() => {
    parseBotConfig({});
  }, /Missing required environment variables for roleflow-bot/);
});

test("parseBotConfig: rejects invalid API base URL", () => {
  assert.throws(() => {
    parseBotConfig({ ...VALID_ENV, ROLEFLOW_API_BASE: "not-a-valid-url" });
  }, /Invalid URL format for ROLEFLOW_API_BASE/);
});

test("parseBotConfig: rejects BOT_API_SECRET shorter than 16 chars", () => {
  assert.throws(() => {
    parseBotConfig({ ...VALID_ENV, BOT_API_SECRET: "short_key" });
  }, /BOT_API_SECRET must be at least 16 characters long/);
});

test("isAuthorizedGuild: strictly checks against authorized guild ID", () => {
  const authorizedId = "999888777666555444";
  assert.equal(isAuthorizedGuild(authorizedId, authorizedId), true);
  assert.equal(isAuthorizedGuild("other-guild-id", authorizedId), false);
  assert.equal(isAuthorizedGuild(null, authorizedId), false);
  assert.equal(isAuthorizedGuild(undefined, authorizedId), false);
});

test("enforceGuildGuard: allows events from authorized RoleFlow guild", async () => {
  const authorizedId = "999888777666555444";
  let leaveCalled = false;
  const mockGuild: GuildLike = {
    id: authorizedId,
    name: "RoleFlow Community",
    leave: async () => {
      leaveCalled = true;
    },
  };

  const res = await enforceGuildGuard(mockGuild, authorizedId);
  assert.deepEqual(res, { allowed: true });
  assert.equal(leaveCalled, false, "Must not leave authorized guild");
});

test("enforceGuildGuard: rejects foreign guild and immediately calls guild.leave()", async () => {
  const authorizedId = "999888777666555444";
  const foreignId = "bad-guild-123";
  let leaveCalled = false;
  const mockForeignGuild: GuildLike = {
    id: foreignId,
    name: "Foreign Server",
    leave: async () => {
      leaveCalled = true;
    },
  };

  const warnings: string[] = [];
  const mockLogger = {
    warn: (msg: string) => warnings.push(msg),
    info: () => {},
  };

  const res = await enforceGuildGuard(mockForeignGuild, authorizedId, mockLogger);
  assert.deepEqual(res, { allowed: false, reason: "FOREIGN_GUILD", foreignGuildId: foreignId });
  assert.equal(leaveCalled, true, "Must call leave() on foreign guild");
  assert.ok(warnings.some((w) => w.includes("[SECURITY ALERT] Received event from unauthorized guild")));
});

test("enforceGuildGuard: permits DM events (guild is null/undefined)", async () => {
  const authorizedId = "999888777666555444";
  const res = await enforceGuildGuard(null, authorizedId);
  assert.deepEqual(res, { allowed: true });
});
