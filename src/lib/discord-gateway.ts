/**
 * High-performance, lightweight Discord Gateway client.
 * Connects directly to Discord WebSocket gateway without bulky dependencies.
 * Keeps bots Online with customizable activity status (Playing, Watching, Listening).
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

class DiscordGatewayConnection {
  private ws: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sequence: number | null = null;
  private isAlive = false;

  constructor(private config: BotConfig) {}

  public start() {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");

      this.ws.on("open", () => {
        console.log(`[Gateway] [${this.config.name}] Connected to Discord Gateway.`);
      });

      this.ws.on("message", (data: WebSocket.RawData) => {
        try {
          const payload = JSON.parse(data.toString());
          const { op, d, s, t } = payload;
          if (s !== null) this.sequence = s;

          switch (op) {
            case 10: // Hello
              this.startHeartbeat(d.heartbeat_interval);
              this.identify();
              break;
            case 11: // Heartbeat ACK
              this.isAlive = true;
              break;
            case 0: // Dispatch
              if (t === "READY") {
                console.log(`[Gateway] [${this.config.name}] Bot is ONLINE as ${d.user.username}#${d.user.discriminator}!`);
              }
              break;
            case 7: // Reconnect
            case 9: // Invalid Session
              this.reconnect();
              break;
          }
        } catch (err) {
          console.error(`[Gateway] [${this.config.name}] Parse error:`, err);
        }
      });

      this.ws.on("close", (code) => {
        console.warn(`[Gateway] [${this.config.name}] Disconnected (code: ${code}). Reconnecting in 5s...`);
        this.cleanup();
        setTimeout(() => this.connect(), 5000);
      });

      this.ws.on("error", (err) => {
        console.error(`[Gateway] [${this.config.name}] Socket error:`, err.message);
      });
    } catch (e) {
      console.error(`[Gateway] [${this.config.name}] Failed to open socket:`, e);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private startHeartbeat(intervalMs: number) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.isAlive = true;

    // Send first heartbeat with jitter per Discord API spec
    this.heartbeatInterval = setInterval(() => {
      if (!this.isAlive) {
        console.warn(`[Gateway] [${this.config.name}] Missed heartbeat ACK. Reconnecting...`);
        this.reconnect();
        return;
      }
      this.isAlive = false;
      this.send(1, this.sequence);
    }, intervalMs);
  }

  private identify() {
    const activityName = this.config.activityName || "Managing Applications";
    const activityType = typeof this.config.activityType === "number" ? this.config.activityType : 3; // 3 = Watching

    const payload = {
      token: this.config.token,
      intents: 0, // Zero privileged intents needed! Keeps it instant and unblocked
      properties: {
        os: "linux",
        browser: "RoleFlow",
        device: "RoleFlow",
      },
      presence: {
        status: this.config.status || "online",
        since: null,
        afk: false,
        activities: [
          {
            name: activityName,
            type: activityType,
            state: "https://roleflow.site",
          },
        ],
      },
    };

    this.send(2, payload);
  }

  private send(op: number, d: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op, d }));
    }
  }

  private reconnect() {
    this.cleanup();
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    setTimeout(() => this.connect(), 3000);
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public stop() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export runner
export { DiscordGatewayConnection, type BotConfig };
