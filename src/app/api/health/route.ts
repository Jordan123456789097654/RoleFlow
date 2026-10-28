import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Health Check Endpoint for Better Stack Uptime Monitoring
 * Endpoint: GET /api/health
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = "unhealthy";
    console.error("[BetterStack Health Check] DB connection failed:", err.message);

    return NextResponse.json(
      {
        status: "degraded",
        service: "roleflow",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        checks: {
          web: "healthy",
          database: {
            status: "unhealthy",
            error: err.message,
          },
        },
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: "healthy",
      service: "roleflow",
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      checks: {
        web: "healthy",
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    },
    { status: 200 }
  );
}
