import { NextResponse } from "next/server";

/** Only the status site may read these endpoints from a browser. */
const STATUS_ORIGIN = "https://status.roleflow.site";

export function statusJson(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      "Access-Control-Allow-Origin": STATUS_ORIGIN,
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}

export function statusOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": STATUS_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}
