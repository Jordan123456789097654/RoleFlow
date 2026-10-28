import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Please provide a valid support access code." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const now = new Date();

    // Find the user whose support code matches and has not expired
    const user = await prisma.user.findFirst({
      where: {
        supportCode: cleanCode,
        supportCodeExpiresAt: {
          gt: now,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired support access code. Codes expire after 10 minutes." },
        { status: 401 }
      );
    }

    // Calculate remaining seconds
    const remainingMs = user.supportCodeExpiresAt ? user.supportCodeExpiresAt.getTime() - now.getTime() : 600000;
    const remainingSeconds = Math.max(Math.floor(remainingMs / 1000), 60);

    // Create session response logging support staff in as the target member
    const response = NextResponse.json({
      success: true,
      message: `Support session established for ${user.username}`,
      targetUser: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
      expiresInSeconds: remainingSeconds,
    });

    // Set cookie valid for the remainder of the 10-minute code
    response.cookies.set("roleflow_user_id", user.id, {
      path: "/",
      httpOnly: true,
      maxAge: remainingSeconds,
      sameSite: "lax",
      domain: ".roleflow.site",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
