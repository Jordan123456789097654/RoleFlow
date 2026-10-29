/**
 * Discord REST client for bot actions. Waits out rate limits (429) using Discord's Retry-After,
 * retries server errors with backoff, and reports whether a failure is worth retrying later.
 */
export type DiscordResult = {
  ok: boolean;
  status: number;
  data: any;
  retryable: boolean;
  error?: string;
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoffMs = (attempt: number) => Math.min(1000 * 2 ** attempt, 15_000) + Math.random() * 500;

export async function discordFetch(
  token: string,
  method: Method,
  path: string,
  body?: unknown,
  opts: { retries?: number } = {}
): Promise<DiscordResult> {
  const retries = opts.retries ?? 3;

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(`https://discord.com/api/v10${path}`, {
        method,
        headers: {
          Authorization: `Bot ${token}`,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      if (attempt < retries) {
        await sleep(backoffMs(attempt));
        continue;
      }
      return { ok: false, status: 0, data: null, retryable: true, error: String(err).slice(0, 300) };
    }

    if (res.status === 429 && attempt < retries) {
      const text = await res.text().catch(() => "");
      let wait = Number(res.headers.get("retry-after"));
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed.retry_after === "number") wait = parsed.retry_after;
      } catch {
        /* keep header value */
      }
      await sleep(Math.min(Math.max(wait || 1, 0.5) * 1000, 30_000));
      continue;
    }

    if (res.status >= 500 && attempt < retries) {
      await sleep(backoffMs(attempt));
      continue;
    }

    const text = await res.text().catch(() => "");
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* not JSON */
    }
    return {
      ok: res.ok,
      status: res.status,
      data,
      retryable: res.status === 429 || res.status >= 500,
      error: res.ok ? undefined : text.slice(0, 300),
    };
  }
}
