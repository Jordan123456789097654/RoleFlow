import { NextRequest, NextResponse } from "next/server";
import { platformOrigin } from "@/lib/platform-origin";

// ---- custom domains ----
const PLATFORM_ORIGIN = platformOrigin();
const PLATFORM_HOSTS = new Set([
  "roleflow.site",
  "www.roleflow.site",
  (() => {
    try {
      return new URL(PLATFORM_ORIGIN).hostname;
    } catch {
      return "roleflow.site";
    }
  })(),
]);

function requestHost(req: NextRequest): string {
  return (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function isPlatformHost(host: string): boolean {
  return !host || PLATFORM_HOSTS.has(host) || host.endsWith(".vercel.app");
}

type Rule = { max: number; windowMs: number };

// Exact-path limits for abuse-prone endpoints.
const EXACT: Record<string, Rule> = {
  "/api/auth/login": { max: 20, windowMs: 15 * 60_000 },
  "/api/auth/forgot-password": { max: 5, windowMs: 15 * 60_000 },
  "/api/auth/reset-password": { max: 10, windowMs: 15 * 60_000 },
  "/api/support/login": { max: 5, windowMs: 15 * 60_000 },
  "/api/feedback": { max: 10, windowMs: 60 * 60_000 },
  "/api/applications/submit": { max: 15, windowMs: 60 * 60_000 },
  "/api/reports": { max: 10, windowMs: 60 * 60_000 },
  "/api/licenses/redeem": { max: 10, windowMs: 15 * 60_000 },
  "/api/user/support/generate": { max: 10, windowMs: 60 * 60_000 },
  "/api/appeals": { max: 5, windowMs: 60 * 60_000 },
  "/api/founder/bulk-email": { max: 60, windowMs: 15 * 60_000 },
  "/api/unsubscribe": { max: 30, windowMs: 15 * 60_000 },
};

// Pattern limits for routes with dynamic segments. GET is limited too where the route calls a third party.
const PATTERNS: Array<{ re: RegExp; methods: string[]; rule: Rule }> = [
  { re: /^\/api\/guilds\/[^/]+\/bot\/(verify|setup|test-embed|commands)$/, methods: ["POST"], rule: { max: 15, windowMs: 15 * 60_000 } },
  { re: /^\/api\/guilds\/[^/]+\/domain\/verify$/, methods: ["POST"], rule: { max: 10, windowMs: 15 * 60_000 } },
  { re: /^\/api\/roblox\/user$/, methods: ["GET"], rule: { max: 30, windowMs: 60_000 } },
  { re: /^\/api\/link-preview$/, methods: ["GET"], rule: { max: 60, windowMs: 60_000 } },
];

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// Endpoints called by Discord's servers, authenticated by Ed25519 signature instead of cookies.
const SIGNED_WEBHOOKS = new Set(["/api/discord/interactions"]);

/**
 * Client IP. X-Forwarded-For can be forged by the client, but every trusted proxy APPENDS the address it saw,
 * so we count from the right. TRUSTED_PROXY_HOPS = number of proxies in front of the app (default 1).
 */
function clientIp(req: NextRequest): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS || 1));
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[Math.max(0, parts.length - hops)];
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// ---- storage: shared (Upstash/Redis REST) when configured, per-instance memory otherwise ----
const memory = new Map<string, { count: number; resetAt: number }>();

async function hit(key: string, rule: Rule): Promise<{ allowed: boolean; retryAfter: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["PEXPIRE", key, String(rule.windowMs), "NX"],
          ["PTTL", key],
        ]),
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const out = (await res.json()) as Array<{ result: number }>;
        const count = Number(out[0]?.result ?? 0);
        const ttl = Math.max(1, Number(out[2]?.result ?? rule.windowMs));
        return { allowed: count <= rule.max, retryAfter: Math.ceil(ttl / 1000) };
      }
    } catch {
      /* fall through to memory so an outage of the limiter never takes the site down */
    }
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + rule.windowMs });
  } else {
    entry.count += 1;
    if (entry.count > rule.max) return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  if (memory.size > 10_000) for (const [k, v] of memory) if (v.resetAt < now) memory.delete(k);
  return { allowed: true, retryAfter: 0 };
}

type HostInfo = { verified: boolean; guildId?: string; slug?: string; positionOk?: boolean };

// Cache of host lookups. Fails closed: a lookup error counts as "not verified".
const hostCache = new Map<string, { info: HostInfo; at: number }>();

async function lookupHost(host: string, position?: string): Promise<HostInfo> {
  const key = `${host}|${position ?? ""}`;
  const hit = hostCache.get(key);
  if (hit && Date.now() - hit.at < (hit.info.verified ? 60_000 : 10_000)) return hit.info;
  let info: HostInfo;
  try {
    const qs = new URLSearchParams({ host });
    if (position) qs.set("position", position);
    const res = await fetch(`${PLATFORM_ORIGIN}/api/custom-domain/resolve?${qs.toString()}`, {
      signal: AbortSignal.timeout(1500),
    });
    info = res.ok ? ((await res.json()) as HostInfo) : { verified: false };
  } catch {
    return { verified: false };
  }
  if (hostCache.size > 5000) hostCache.clear();
  hostCache.set(key, { info, at: Date.now() });
  return info;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // A community's own domain: serve its portal at "/", keep the API working, and send everything
  // else to roleflow.site. Login is handed off from roleflow.site with a short-lived token.
  const host = requestHost(req);
  if (!isPlatformHost(host)) {
    const parts = pathname.split("/").filter(Boolean); // e.g. ["c", "meridian"]
    const info = await lookupHost(host, parts[0] === "apply" ? parts[1] : undefined);
    // Unknown or unverified domains go back to roleflow.site.
    if (!info.verified) {
      return NextResponse.redirect(new URL(pathname + req.nextUrl.search, PLATFORM_ORIGIN), 308);
    }

    if (pathname.startsWith("/api/")) {
      // API routes work on the domain (sign-in, applying, dashboard data). Fall through to the checks below.
    } else if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = `/domain-portal/${encodeURIComponent(host)}`;
      return NextResponse.rewrite(url);
    } else {
      // Only this community's pages are reachable here: its portal, its apply pages, and its dashboard.
      const allowed =
        (parts[0] === "c" && (parts[1] === info.slug || parts[1] === info.guildId)) ||
        (parts[0] === "dashboard" && parts[1] === info.guildId) ||
        (parts[0] === "apply" && info.positionOk === true);
      if (allowed) return NextResponse.next();
      const home = req.nextUrl.clone();
      home.pathname = "/";
      home.search = "";
      return NextResponse.redirect(home, 308);
    }
  }

  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // CSRF defence for cookie-authenticated mutations.
  if (MUTATING.has(req.method) && !SIGNED_WEBHOOKS.has(pathname)) {
    if (req.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
    }
    const origin = req.headers.get("origin");
    if (origin) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
      if (originHost !== host) {
        return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
      }
    }
  }

  let rule: Rule | undefined = req.method === "POST" ? EXACT[pathname] : undefined;
  let bucket = pathname;
  if (!rule) {
    const p = PATTERNS.find((x) => x.re.test(pathname) && x.methods.includes(req.method));
    if (p) {
      rule = p.rule;
      bucket = p.re.source;
    }
  }

  if (rule) {
    const { allowed, retryAfter } = await hit(`rl:${bucket}:${clientIp(req)}`, rule);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Every page and API route, except Next.js build assets and files with an extension (images, robots.txt).
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
