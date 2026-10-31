/**
 * Modmail System for RoleFlow Internal Discord Bot
 */

export interface ModmailApiClient {
  openThread: (params: { discordId: string; username: string; staffThreadId: string }) => Promise<{ threadId: string }>;
  recordMessage: (params: { threadId: string; from: string; content: string; direction: "INBOUND" | "OUTBOUND" }) => Promise<{ ok: boolean }>;
  closeThread: (params: { threadId: string; closedBy: string }) => Promise<{ ok: boolean; durationMinutes: number; messageCount: number }>;
  blockUser: (params: { discordId: string; blockedBy: string; reason?: string }) => Promise<{ ok: boolean }>;
}

export interface ThreadSession {
  threadId: string; // Internal ApplyHub DB thread id
  discordUserId: string;
  username: string;
  staffThreadId: string;
  status: "OPEN" | "CLOSED";
  messages: Array<{
    author: string;
    content: string;
    direction: "INBOUND" | "OUTBOUND";
    timestamp: Date;
  }>;
  createdAt: Date;
}

export class ModmailRateLimiter {
  private userDMTimestamps = new Map<string, number[]>();
  private readonly maxPerMinute: number;
  private readonly windowMs: number;

  constructor(maxPerMinute = 5, windowMs = 60_000) {
    this.maxPerMinute = maxPerMinute;
    this.windowMs = windowMs;
  }

  /**
   * Check if user is allowed to send a DM.
   * Returns true if allowed, false if rate limited.
   */
  public checkRateLimit(userId: string, now?: number): boolean {
    const current = now ?? Date.now();
    const timestamps = (this.userDMTimestamps.get(userId) || []).filter(
      (ts) => Math.abs(current - ts) < this.windowMs
    );

    if (timestamps.length >= this.maxPerMinute) {
      return false;
    }

    timestamps.push(current);
    this.userDMTimestamps.set(userId, timestamps);
    return true;
  }

  public reset(userId?: string): void {
    if (userId) {
      this.userDMTimestamps.delete(userId);
    } else {
      this.userDMTimestamps.clear();
    }
  }
}

export class ModmailManager {
  private rateLimiter: ModmailRateLimiter;
  private apiClient: ModmailApiClient;
  // In-memory lookup tables for fast discord routing
  public activeUserThreads = new Map<string, ThreadSession>(); // discordUserId -> ThreadSession
  public activeStaffThreads = new Map<string, ThreadSession>(); // staffThreadId -> ThreadSession

  constructor(apiClient: ModmailApiClient, rateLimiter?: ModmailRateLimiter) {
    this.apiClient = apiClient;
    this.rateLimiter = rateLimiter || new ModmailRateLimiter(5, 60_000);
  }

  public getRateLimiter(): ModmailRateLimiter {
    return this.rateLimiter;
  }

  /**
   * Handle incoming direct message from a user.
   */
  public async handleUserDM(params: {
    author: { id: string; username: string; bot: boolean };
    content: string;
    sendDM: (msg: string) => Promise<any>;
    reactSuccess: () => Promise<any>;
    createStaffThread: (threadName: string) => Promise<{ id: string; send: (msg: string) => Promise<any> }>;
  }): Promise<{ status: "IGNORED_BOT" | "RATE_LIMITED" | "THREAD_OPENED" | "MESSAGE_ROUTED" | "BLOCKED" }> {
    // 1. Ignore bots
    if (params.author.bot) {
      return { status: "IGNORED_BOT" };
    }

    const userId = params.author.id;

    // 2. Rate limiter check (max 5 DMs per minute per member; 6th gets polite warning)
    const allowed = this.rateLimiter.checkRateLimit(userId);
    if (!allowed) {
      await params.sendDM("⚠️ You are sending messages too quickly. Please wait a minute before sending another message.");
      return { status: "RATE_LIMITED" };
    }

    let session = this.activeUserThreads.get(userId);

    // 3. If no open thread exists for user: create private thread in STAFF_CHANNEL_ID
    if (!session || session.status === "CLOSED") {
      const threadName = `modmail-${params.author.username}-${userId}`;
      let staffThread: { id: string; send: (msg: string) => Promise<any> };
      try {
        staffThread = await params.createStaffThread(threadName);
      } catch (err: any) {
        throw new Error(`Failed to create staff thread: ${err?.message}`);
      }

      let res: { threadId: string };
      try {
        res = await this.apiClient.openThread({
          discordId: userId,
          username: params.author.username,
          staffThreadId: staffThread.id,
        });
      } catch (err: any) {
        if (err?.message?.includes("403") || err?.status === 403) {
          await params.sendDM("❌ You are blocked from submitting modmail inquiries.");
          return { status: "BLOCKED" };
        }
        throw err;
      }

      session = {
        threadId: res.threadId,
        discordUserId: userId,
        username: params.author.username,
        staffThreadId: staffThread.id,
        status: "OPEN",
        messages: [],
        createdAt: new Date(),
      };

      this.activeUserThreads.set(userId, session);
      this.activeStaffThreads.set(staffThread.id, session);

      // Post initial message in staff thread
      await staffThread.send(`📬 **New Modmail Thread Started**\n**User:** ${params.author.username} (<@${userId}>)\n\n**Initial Message:**\n${params.content}`);

      // Call API to record message
      await this.apiClient.recordMessage({
        threadId: res.threadId,
        from: userId,
        content: params.content,
        direction: "INBOUND",
      });

      session.messages.push({
        author: params.author.username,
        content: params.content,
        direction: "INBOUND",
        timestamp: new Date(),
      });

      // Confirm to user
      await params.reactSuccess();
      await params.sendDM("✅ Your message has been delivered to the RoleFlow staff team. We will reply here as soon as possible.");

      return { status: "THREAD_OPENED" };
    }

    // 4. If open thread exists: forward DM to existing thread
    const staffThread = await params.createStaffThread(`modmail-${session.username}-${userId}`);
    await staffThread.send(`💬 **${params.author.username}:** ${params.content}`);

    await this.apiClient.recordMessage({
      threadId: session.threadId,
      from: userId,
      content: params.content,
      direction: "INBOUND",
    });

    session.messages.push({
      author: params.author.username,
      content: params.content,
      direction: "INBOUND",
      timestamp: new Date(),
    });

    await params.reactSuccess();
    return { status: "MESSAGE_ROUTED" };
  }

  /**
   * Handle messages sent by staff in modmail threads.
   */
  public async handleStaffReply(params: {
    staffThreadId: string;
    author: { id: string; username: string; bot: boolean; roleName?: string };
    content: string;
    useRoleAnonymity?: boolean;
    sendToUserDM: (msg: string) => Promise<any>;
  }): Promise<{ status: "IGNORED_BOT" | "NOT_MODMAIL_THREAD" | "THREAD_CLOSED" | "RELAYED" }> {
    if (params.author.bot) {
      return { status: "IGNORED_BOT" };
    }

    const session = this.activeStaffThreads.get(params.staffThreadId);
    if (!session) {
      return { status: "NOT_MODMAIL_THREAD" };
    }

    if (session.status === "CLOSED") {
      return { status: "THREAD_CLOSED" };
    }

    // Prefix with staff member's display name or role (supporting staff anonymity)
    const prefix = params.useRoleAnonymity
      ? params.author.roleName || "Staff"
      : params.author.username;

    const formattedMessage = `🛡️ **[${prefix}]**: ${params.content}`;

    await params.sendToUserDM(formattedMessage);

    await this.apiClient.recordMessage({
      threadId: session.threadId,
      from: params.author.id,
      content: params.content,
      direction: "OUTBOUND",
    });

    session.messages.push({
      author: prefix,
      content: params.content,
      direction: "OUTBOUND",
      timestamp: new Date(),
    });

    return { status: "RELAYED" };
  }

  /**
   * Slash command `/close` handler.
   */
  public async handleCloseCommand(params: {
    staffThreadId: string;
    closedBy: { id: string; username: string };
    postSummary: (summary: string) => Promise<any>;
    sendReceiptDM: (receipt: string) => Promise<any>;
    archiveThread: () => Promise<any>;
  }): Promise<{ ok: boolean; error?: string; durationMinutes?: number; messageCount?: number }> {
    const session = this.activeStaffThreads.get(params.staffThreadId);
    if (!session) {
      return { ok: false, error: "This channel is not an active modmail thread." };
    }

    // If already closed, refuse second close
    if (session.status === "CLOSED") {
      return { ok: false, error: "This modmail thread has already been closed." };
    }

    session.status = "CLOSED";

    // Call ApplyHub API
    const res = await this.apiClient.closeThread({
      threadId: session.threadId,
      closedBy: params.closedBy.id,
    });

    // Remove from active maps
    this.activeUserThreads.delete(session.discordUserId);
    this.activeStaffThreads.delete(session.staffThreadId);

    // Summary text
    const summary = `🔒 **Modmail Thread Closed**\n` +
      `**Closed By:** <@${params.closedBy.id}>\n` +
      `**Duration:** ${res.durationMinutes} minute(s)\n` +
      `**Total Messages:** ${res.messageCount}`;

    await params.postSummary(summary);

    // Receipt / transcript for member
    const transcriptLines = session.messages.map((m) => {
      const dirTag = m.direction === "INBOUND" ? "You" : m.author;
      return `[${m.timestamp.toISOString()}] ${dirTag}: ${m.content}`;
    });

    const receipt = `🔒 **Your Modmail Thread Has Been Closed**\n` +
      `**Closed By:** ${params.closedBy.username}\n` +
      `**Duration:** ${res.durationMinutes} min | **Messages:** ${res.messageCount}\n\n` +
      `**Receipt Transcript:**\n\`\`\`\n${transcriptLines.join("\n") || "No messages recorded."}\n\`\`\``;

    try {
      await params.sendReceiptDM(receipt);
    } catch {
      // User might have DMs closed or blocked bot; ignore receipt delivery failure
    }

    await params.archiveThread();

    return { ok: true, durationMinutes: res.durationMinutes, messageCount: res.messageCount };
  }

  /**
   * Slash command `/block` handler.
   */
  public async handleBlockCommand(params: {
    discordUserId: string;
    blockedBy: { id: string; username: string };
    reason?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    await this.apiClient.blockUser({
      discordId: params.discordUserId,
      blockedBy: params.blockedBy.id,
      reason: params.reason,
    });

    // Close any active thread if present
    const existing = this.activeUserThreads.get(params.discordUserId);
    if (existing) {
      existing.status = "CLOSED";
      this.activeUserThreads.delete(params.discordUserId);
      this.activeStaffThreads.delete(existing.staffThreadId);
    }

    return { ok: true };
  }
}

/**
 * Creates default HTTP Api client talking to ApplyHub / RoleFlow backend.
 */
export function createHttpApiClient(apiBase: string, botApiSecret: string): ModmailApiClient {
  const base = apiBase.replace(/\/+$/, "");

  async function postJson<T = any>(endpoint: string, body: any): Promise<T> {
    const res = await fetch(`${base}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${botApiSecret}`,
      },
      body: JSON.stringify(body),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data?.error || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data as T;
  }

  return {
    openThread: (p) => postJson<{ threadId: string }>("/api/bot/modmail/open", p),
    recordMessage: (p) => postJson<{ ok: boolean }>("/api/bot/modmail/message", p),
    closeThread: (p) => postJson<{ ok: boolean; durationMinutes: number; messageCount: number }>("/api/bot/modmail/close", p),
    blockUser: (p) => postJson<{ ok: boolean }>("/api/bot/modmail/block", p),
  };
}
