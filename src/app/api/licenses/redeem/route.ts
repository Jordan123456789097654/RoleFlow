import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return NextResponse.json(
    { error: "License key redemption is currently disabled during the Open Beta. RoleFlow Pro and premium subscriptions are coming soon!" },
    { status: 400 }
  );
}
