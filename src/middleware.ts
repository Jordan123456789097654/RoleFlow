import { NextRequest, NextResponse } from "next/server";

// Per-instance, in-memory rate limits for abuse-prone endpoints.
// Note: serverless/multi-instance deployments need a shared store (e.g. Redis) for strict limits.
const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/auth/login": { max: 10, windowMs: 15 * 60_000 },
  "/api/auth/forgot-password": { max: 5, windowMs: 15 * 60_000 },
  "/api/auth/reset-password": { max: 10, windowMs: 15 * 60_000 },
  "/api/support/login": { max: 5, windowMs: 15 * 60_000 },
  "/api/feedback": { max: 10, windowMs: 60 * 60_000 },
};

const hits = new Map<string, { count: number; resetAt: number }>();
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip") || "unknown").trim();
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF defense: browsers always send Origin on cross-site mutating requests.
  // If an Origin is present it must match the host we are serving.
  if (MUTATING.has(req.method)) {
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

  const limit = LIMITS[pathname];
  if (limit && req.method === "POST") {
    const now = Date.now();
    const key = `${pathname}:${clientIp(req)}`;
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + limit.windowMs });
    } else {
      entry.count += 1;
      if (entry.count > limit.max) {
        const retry = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
          { error: "Too many attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(retry) } }
        );
      }
    }
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
