import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VerificationApiClient,
  createVerificationEmbed,
  createUsernameModal,
  applyVerifiedMemberSync,
  handleVerifyButtonClick,
  handleUsernameModalSubmit,
  handleConfirmButtonClick,
} from "./verification";
import type { BotConfig } from "./config";

const MOCK_CONFIG: BotConfig = {
  discordBotToken: "token-test",
  discordAppId: "app-test",
  roleflowServerId: "server-123",
  verifyChannelId: "chan-123",
  staffChannelId: "staff-123",
  verifiedRoleId: "role-verified-123",
  roleflowApiBase: "https://api.roleflow.test",
  botApiSecret: "super_secret_test_key_32_characters",
};

test("createVerificationEmbed: constructs embed and button with expected parameters", () => {
  const result = createVerificationEmbed();
  assert.equal(result.embeds.length, 1);
  assert.equal(result.components.length, 1);

  const embed = result.embeds[0].data;
  assert.equal(embed.title, "Roblox Account Verification");
  assert.ok(embed.description?.includes("Verify Roblox Account"));

  const row = result.components[0];
  const button = (row.components as any[])[0].data;
  assert.equal(button.custom_id, "verify_start_btn");
  assert.equal(button.label, "Verify Roblox Account");
});

test("createUsernameModal: builds modal asking for Roblox username", () => {
  const modal = createUsernameModal();
  assert.equal(modal.data.custom_id, "verify_username_modal");
  assert.equal(modal.data.title, "Enter Roblox Username");

  const components = modal.components as any[];
  assert.equal(components.length, 1);
  const input = components[0].components[0].data;
  assert.equal(input.custom_id, "roblox_username_input");
  assert.equal(input.required, true);
});

test("VerificationApiClient: initiates, confirms, and checks status", async () => {
  const requests: { url: string; options: any }[] = [];

  const mockFetch = async (url: any, options: any) => {
    requests.push({ url: String(url), options });

    if (String(url).endsWith("/api/bot/verify")) {
      return {
        ok: true,
        json: async () => ({ linked: true, user: { id: "123", username: "rbxUser", robloxId: "999", robloxUsername: "rbxUser" } }),
      } as any;
    }

    if (String(url).endsWith("/api/bot/verify/initiate")) {
      return {
        ok: true,
        json: async () => ({ robloxId: "999", robloxUsername: "rbxUser", safeword: "roleflow-echo-4912" }),
      } as any;
    }

    if (String(url).endsWith("/api/bot/verify/confirm")) {
      return {
        ok: true,
        json: async () => ({ success: true, robloxId: "999", robloxUsername: "rbxUser" }),
      } as any;
    }

    return { ok: false, status: 404 } as any;
  };

  const client = new VerificationApiClient(MOCK_CONFIG.roleflowApiBase, MOCK_CONFIG.botApiSecret, mockFetch as any);

  // 1. checkStatus
  const statusRes = await client.checkStatus("user-123");
  assert.equal(statusRes.linked, true);
  assert.equal(requests[0].options.headers["Authorization"], `Bearer ${MOCK_CONFIG.botApiSecret}`);

  // 2. initiate
  const initRes = await client.initiate("user-123", "rbxUser");
  assert.equal(initRes.safeword, "roleflow-echo-4912");

  // 3. confirm
  const confirmRes = await client.confirm("user-123");
  assert.equal(confirmRes.success, true);
});

test("applyVerifiedMemberSync: assigns role and sets nickname", async () => {
  let roleAdded: string | null = null;
  let nicknameSet: string | null = null;

  const mockMember = {
    roles: {
      cache: new Map(),
      add: async (id: string) => {
        roleAdded = id;
      },
    },
    nickname: "OldNick",
    setNickname: async (nick: string) => {
      nicknameSet = nick;
    },
  } as any;

  const res = await applyVerifiedMemberSync(mockMember, "NewRobloxName", "role-verified-123");
  assert.equal(res.roleAssigned, true);
  assert.equal(res.nicknameUpdated, true);
  assert.equal(roleAdded, "role-verified-123");
  assert.equal(nicknameSet, "NewRobloxName");
});

test("applyVerifiedMemberSync: handles nickname failure gracefully without failing role assignment", async () => {
  let roleAdded: string | null = null;

  const mockMember = {
    roles: {
      cache: new Map(),
      add: async (id: string) => {
        roleAdded = id;
      },
    },
    nickname: "OwnerNick",
    setNickname: async () => {
      throw new Error("Missing Permissions (Hierarchy)");
    },
  } as any;

  const res = await applyVerifiedMemberSync(mockMember, "NewRobloxName", "role-verified-123");
  assert.equal(res.roleAssigned, true);
  assert.equal(res.nicknameUpdated, false);
});

test("handleVerifyButtonClick: replies gracefully if already verified via role", async () => {
  let repliedContent: string | null = null;
  let ephemeral: boolean | null = null;

  const mockMember = {
    roles: {
      cache: new Map([["role-verified-123", true]]),
    },
  };

  const mockInteraction = {
    user: { id: "user-1" },
    member: mockMember,
    reply: async (opts: any) => {
      repliedContent = opts.content;
      ephemeral = opts.ephemeral;
    },
    showModal: async () => {},
  } as any;

  const dummyClient = new VerificationApiClient("https://api.test", "secret-test-32-chars");
  await handleVerifyButtonClick(mockInteraction, dummyClient, MOCK_CONFIG);

  const replied: string = repliedContent || "";
  assert.ok(replied.includes("already verified"));
  assert.equal(ephemeral, true);
});


test("handleUsernameModalSubmit: calls initiate and displays instructions with safeword", async () => {
  let replyData: any = null;

  const mockInteraction = {
    user: { id: "user-123" },
    fields: {
      getTextInputValue: () => "TestRobloxian",
    },
    deferReply: async () => {},
    editReply: async (opts: any) => {
      replyData = opts;
    },
  } as any;

  const mockFetch = async () =>
    ({
      ok: true,
      json: async () => ({
        robloxId: "987654",
        robloxUsername: "TestRobloxian",
        safeword: "roleflow-timber-echo-4912",
      }),
    } as any);

  const client = new VerificationApiClient(MOCK_CONFIG.roleflowApiBase, MOCK_CONFIG.botApiSecret, mockFetch as any);

  await handleUsernameModalSubmit(mockInteraction, client);

  assert.ok(replyData.embeds?.length > 0);
  const embed = replyData.embeds[0].data;
  assert.ok(embed.description.includes("roleflow-timber-echo-4912"));
  assert.equal(replyData.components.length, 1);
});

test("handleConfirmButtonClick: handles successful verification", async () => {
  let replyData: any = null;

  const mockMember = {
    roles: {
      cache: new Map(),
      add: async () => {},
    },
    nickname: null,
    setNickname: async () => {},
  };

  const mockInteraction = {
    user: { id: "user-123" },
    member: mockMember,
    deferReply: async () => {},
    editReply: async (opts: any) => {
      replyData = opts;
    },
  } as any;

  const mockFetch = async () =>
    ({
      ok: true,
      json: async () => ({
        success: true,
        robloxId: "987654",
        robloxUsername: "TestRobloxian",
      }),
    } as any);

  const client = new VerificationApiClient(MOCK_CONFIG.roleflowApiBase, MOCK_CONFIG.botApiSecret, mockFetch as any);

  await handleConfirmButtonClick(mockInteraction, client, MOCK_CONFIG);

  assert.ok(replyData.content.includes("Verification complete!"));
  assert.ok(replyData.embeds[0].data.title.includes("Verification Successful"));
});

test("handleConfirmButtonClick: handles safeword not found error with helpful prompt", async () => {
  let replyData: any = null;

  const mockInteraction = {
    user: { id: "user-123" },
    member: null,
    deferReply: async () => {},
    editReply: async (opts: any) => {
      replyData = opts;
    },
  } as any;

  const mockFetch = async () =>
    ({
      ok: true,
      json: async () => ({
        success: false,
        reason: "SAFEWORD_NOT_FOUND",
        expectedSafeword: "roleflow-blaze-canyon-7890",
      }),
    } as any);

  const client = new VerificationApiClient(MOCK_CONFIG.roleflowApiBase, MOCK_CONFIG.botApiSecret, mockFetch as any);

  await handleConfirmButtonClick(mockInteraction, client, MOCK_CONFIG);

  assert.ok(replyData.content.includes("We could not find the safeword"));
  assert.ok(replyData.content.includes("roleflow-blaze-canyon-7890"));
});
