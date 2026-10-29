/**
 * Lightweight Discord Gateway client for community bots.
 * Keeps each bot online with a custom activity. Handles HELLO, heartbeats,
 * IDENTIFY, RESUME (op 6) after recoverable drops, and clean reconnects.
 */

import WebSocket from "ws";

interface BotConfig {
  guildId: string;
  name: string;
  token: string;
  status?: "online" | "idle" | "dnd" | "invisible";
  activityType?: 0 | 1 | 2 | 3 | 5; // 0=Playing, 1=Streaming, 2=Listening, 3=Watching, 5=Competing
  activityName?: string;
}

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

class DiscordGatewayConnection {
  private ws: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private sequence: number | null = null;
  private sessionId: string | null = null;
  private resumeUrl: string | null = null;
  private isAlive = false;
  private stopped = false;

  constructor(private config: BotConfig) {}

  public start() {
    this.stopped = false;
    this.connect();
  }

  private log(msg: string) {
    console.log(`[Gateway] [${this.config.name}] ${msg}`);
  }

  private connect() {
    if (this.stopped) return;
    this.teardownSocket();

    const url = this.sessionId && this.resumeUrl ? this.resumeUrl : GATEWAY_URL;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.on("message", (data: WebSocket.RawData) => this.onPayload(ws, data));

    ws.on("close", (code) => {
      if (this.ws !== ws) return; // a newer socket has taken over
      this.cleanupHeartbeat();
      this.ws = null;
      this.log(`Disconnected (code ${code}).`);
      // 4004 = bad token, 4010-4014 = invalid shard/intents: do not retry.
      if (code === 4004 || (code >= 4010 && code <= 4014)) {
        this.log("Fatal gateway error. Not reconnecting; check the bot token and settings.");
        this.stopped = true;
        return;
      }
      // Resumable codes keep the session; anything else starts fresh.
      if (code === 4000 || code === 4001 || code === 4002 || code === 4003 || code === 4005 || code === 4007 || code === 4009) {
        this.sessionId = null;
        this.sequence = null;
      }
      this.scheduleReconnect(5000);
    });

    ws.on("error", (err) => {
      this.log(`Socket error: ${err.message}`);
    });
  }

  private onPayload(ws: WebSocket, data: WebSocket.RawData) {
    if (this.ws !== ws) return;
    let payload: any;
    try {
      payload = JSON.parse(data.toString());
    } catch (err) {
      this.log(`Parse error: ${String(err)}`);
      return;
    }
    const { op, d, s, t } = payload;
    if (typeof s === "number") this.sequence = s;

    switch (op) {
      case 10: // Hello
        this.startHeartbeat(d.heartbeat_interval);
        if (this.sessionId) this.resume();
        else this.identify();
        break;
      case 11: // Heartbeat ACK
        this.isAlive = true;
        break;
      case 1: // Server requests an immediate heartbeat
        this.send(1, this.sequence);
        break;
      case 0: // Dispatch
        if (t === "READY") {
          this.sessionId = d.session_id;
          this.resumeUrl = d.resume_gateway_url || null;
          this.log(`ONLINE as ${d.user?.username ?? "unknown"}.`);
        } else if (t === "RESUMED") {
          this.log("Session resumed.");
        }
        break;
      case 7: // Reconnect requested: resume on a fresh socket
        this.log("Server requested reconnect.");
        ws.close(4000);
        break;
      case 9: // Invalid session
        this.log("Invalid session.");
        if (!d) {
          this.sessionId = null;
          this.sequence = null;
        }
        ws.close(4000);
        break;
    }
  }

  private startHeartbeat(intervalMs: number) {
    this.cleanupHeartbeat();
    this.isAlive = true;
    // Jitter the first beat per Discord's spec.
    const first = setTimeout(() => {
      this.beat(intervalMs);
      this.heartbeatInterval = setInterval(() => this.beat(intervalMs), intervalMs);
    }, Math.floor(Math.random() * intervalMs));
    this.heartbeatInterval = first as unknown as NodeJS.Timeout;
  }

  private beat(_intervalMs: number) {
    if (!this.isAlive) {
      this.log("Missed heartbeat ACK. Reconnecting...");
      this.ws?.terminate();
      return;
    }
    this.isAlive = false;
    this.send(1, this.sequence);
  }

  private identify() {
    const activityName = this.config.activityName || "Managing Applications";
    const activityType = typeof this.config.activityType === "number" ? this.config.activityType : 3;

    this.send(2, {
      token: this.config.token,
      intents: 0, // No privileged intents needed for presence and slash commands
      properties: { os: "linux", browser: "RoleFlow", device: "RoleFlow" },
      presence: {
        status: this.config.status || "online",
        since: null,
        afk: false,
        activities: [{ name: activityName, type: activityType, state: "https://roleflow.site" }],
      },
    });
  }

  private resume() {
    this.send(6, {
      token: this.config.token,
      session_id: this.sessionId,
      seq: this.sequence,
    });
  }

  private send(op: number, d: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op, d }));
    }
  }

  private scheduleReconnect(delayMs: number) {
    if (this.stopped || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delayMs);
  }

  private cleanupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      clearTimeout(this.heartbeatInterval as unknown as NodeJS.Timeout);
      this.heartbeatInterval = null;
    }
  }

  private teardownSocket() {
    this.cleanupHeartbeat();
    if (this.ws) {
      const old = this.ws;
      this.ws = null;
      try { old.removeAllListeners(); old.on("error", () => {}); old.terminate(); } catch (_) {}
    }
  }

  public stop() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.teardownSocket();
  }
}

export { DiscordGatewayConnection, type BotConfig };
