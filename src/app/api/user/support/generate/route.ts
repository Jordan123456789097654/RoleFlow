import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate readable, high-entropy 8-character support token: RF-XXXX-XXXX
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const code = `RF-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}`;

    // Set 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        supportCode: code,
        supportCodeExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      code,
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes: 10,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
