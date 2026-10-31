import { test } from "node:test";
import assert from "node:assert/strict";
import { ModmailManager, ModmailRateLimiter, ModmailApiClient } from "./modmail";

function createMockApiClient(): ModmailApiClient & {
  opened: any[];
  messages: any[];
  closed: any[];
  blocked: any[];
} {
  return {
    opened: [],
    messages: [],
    closed: [],
    blocked: [],
    async openThread(params) {
      this.opened.push(params);
      return { threadId: `thread-${Date.now()}` };
    },
    async recordMessage(params) {
      this.messages.push(params);
      return { ok: true };
    },
    async closeThread(params) {
      this.closed.push(params);
      return { ok: true, durationMinutes: 12, messageCount: this.messages.length };
    },
    async blockUser(params) {
      this.blocked.push(params);
      return { ok: true };
    },
  };
}

test("Rate limiter: allows 5 DMs per minute and holds back 6th DM with warning", async () => {
  const limiter = new ModmailRateLimiter(5, 60_000);
  const userId = "user-12345";
  const now = Date.now();

  for (let i = 1; i <= 5; i++) {
    const allowed = limiter.checkRateLimit(userId, now + i * 100);
    assert.equal(allowed, true, `Message ${i} must be allowed`);
  }

  // 6th message within the same minute
  const allowed6 = limiter.checkRateLimit(userId, now + 600);
  assert.equal(allowed6, false, "6th message within window must be rate limited");

  // In full manager flow with rate limiter already holding 5 timestamps
  const api = createMockApiClient();
  const manager = new ModmailManager(api, limiter);

  const sentDMs: string[] = [];
  const reactions: string[] = [];
  const res = await manager.handleUserDM({
    author: { id: userId, username: "SpeedyUser", bot: false },
    content: "Spam message 6",
    sendDM: async (m) => sentDMs.push(m),
    reactSuccess: async () => reactions.push("react"),
    createStaffThread: async () => ({ id: "thread-1", send: async () => {} }),
  });

  assert.equal(res.status, "RATE_LIMITED");
  assert.equal(sentDMs.length, 1);
  assert.ok(sentDMs[0].includes("sending messages too quickly"));
  assert.equal(reactions.length, 0);
});

test("Thread routing: First DM opens thread, second goes to same thread", async () => {
  const api = createMockApiClient();
  const manager = new ModmailManager(api);
  const userId = "user-555";
  const staffThreadMessages: string[] = [];
  const userDMs: string[] = [];
  const threadId = "staff-thread-999";

  const mockStaffThread = {
    id: threadId,
    send: async (msg: string) => {
      staffThreadMessages.push(msg);
    },
  };

  // First DM
  const firstRes = await manager.handleUserDM({
    author: { id: userId, username: "Alice", bot: false },
    content: "Hello, I need help with my account",
    sendDM: async (msg) => userDMs.push(msg),
    reactSuccess: async () => {},
    createStaffThread: async () => mockStaffThread,
  });

  assert.equal(firstRes.status, "THREAD_OPENED");
  assert.equal(api.opened.length, 1);
  assert.equal(api.opened[0].discordId, userId);
  assert.equal(api.opened[0].staffThreadId, threadId);
  assert.equal(staffThreadMessages.length, 1);
  assert.ok(staffThreadMessages[0].includes("New Modmail Thread Started"));

  // Second DM from same user
  const secondRes = await manager.handleUserDM({
    author: { id: userId, username: "Alice", bot: false },
    content: "Also here is another detail",
    sendDM: async (msg) => userDMs.push(msg),
    reactSuccess: async () => {},
    createStaffThread: async () => mockStaffThread,
  });

  assert.equal(secondRes.status, "MESSAGE_ROUTED");
  // Should not call openThread a second time
  assert.equal(api.opened.length, 1);
  assert.equal(staffThreadMessages.length, 2);
  assert.ok(staffThreadMessages[1].includes("Also here is another detail"));
  // Both messages recorded via API
  assert.equal(api.messages.length, 2);
  assert.equal(api.messages[0].direction, "INBOUND");
  assert.equal(api.messages[1].direction, "INBOUND");
});

test("Staff reply listener: staff reply relays to user DM with prefix / role anonymity", async () => {
  const api = createMockApiClient();
  const manager = new ModmailManager(api);
  const userId = "user-777";
  const staffThreadId = "staff-channel-456";
  const userDMs: string[] = [];

  // Open thread first
  await manager.handleUserDM({
    author: { id: userId, username: "Bob", bot: false },
    content: "Question for staff",
    sendDM: async () => {},
    reactSuccess: async () => {},
    createStaffThread: async () => ({ id: staffThreadId, send: async () => {} }),
  });

  // Staff replies
  const replyRes = await manager.handleStaffReply({
    staffThreadId,
    author: { id: "staff-1", username: "ModCharlie", bot: false, roleName: "Support Team" },
    content: "We can help you with that!",
    useRoleAnonymity: false,
    sendToUserDM: async (msg) => userDMs.push(msg),
  });

  assert.equal(replyRes.status, "RELAYED");
  assert.equal(userDMs.length, 1);
  assert.ok(userDMs[0].includes("[ModCharlie]"));
  assert.ok(userDMs[0].includes("We can help you with that!"));

  // Staff replies with role anonymity
  await manager.handleStaffReply({
    staffThreadId,
    author: { id: "staff-1", username: "ModCharlie", bot: false, roleName: "Support Team" },
    content: "This is an anonymous note.",
    useRoleAnonymity: true,
    sendToUserDM: async (msg) => userDMs.push(msg),
  });

  assert.equal(userDMs.length, 2);
  assert.ok(userDMs[1].includes("[Support Team]"));
  assert.ok(userDMs[1].includes("This is an anonymous note."));
});

test("Close command: posts summary, DMs receipt, archives thread, and refuses second close", async () => {
  const api = createMockApiClient();
  const manager = new ModmailManager(api);
  const userId = "user-888";
  const staffThreadId = "staff-channel-888";

  // Open thread
  await manager.handleUserDM({
    author: { id: userId, username: "David", bot: false },
    content: "Issue resolved soon",
    sendDM: async () => {},
    reactSuccess: async () => {},
    createStaffThread: async () => ({ id: staffThreadId, send: async () => {} }),
  });

  const postedSummaries: string[] = [];
  const receiptDMs: string[] = [];
  let threadArchived = false;

  // First close
  const firstClose = await manager.handleCloseCommand({
    staffThreadId,
    closedBy: { id: "staff-admin", username: "AdminAlex" },
    postSummary: async (s) => postedSummaries.push(s),
    sendReceiptDM: async (r) => receiptDMs.push(r),
    archiveThread: async () => {
      threadArchived = true;
    },
  });

  assert.equal(firstClose.ok, true);
  assert.equal(api.closed.length, 1);
  assert.equal(postedSummaries.length, 1);
  assert.ok(postedSummaries[0].includes("Modmail Thread Closed"));
  assert.equal(receiptDMs.length, 1);
  assert.ok(receiptDMs[0].includes("Your Modmail Thread Has Been Closed"));
  assert.equal(threadArchived, true);

  // Second close attempt on same staff thread
  const secondClose = await manager.handleCloseCommand({
    staffThreadId,
    closedBy: { id: "staff-admin", username: "AdminAlex" },
    postSummary: async () => {},
    sendReceiptDM: async () => {},
    archiveThread: async () => {},
  });

  assert.equal(secondClose.ok, false);
  assert.ok(secondClose.error?.includes("not an active modmail thread") || secondClose.error?.includes("already been closed"));
  assert.equal(api.closed.length, 1, "closeThread API should only have been called once");
});
