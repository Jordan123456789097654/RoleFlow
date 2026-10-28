import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const callerId = cookieStore.get("roleflow_user_id")?.value;

    if (!callerId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in with your Support Staff Discord account first." },
        { status: 401 }
      );
    }

    const caller = await prisma.user.findUnique({ where: { id: callerId } });
    const isStaff = caller?.isSupportStaff || caller?.isSiteAdmin || caller?.id === "1046538179399929957";

    if (!isStaff) {
      return NextResponse.json(
        { error: "Access denied. Only authorized RoleFlow Support Staff can initiate diagnostic sessions." },
        { status: 403 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Please provide a valid support access code." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const now = new Date();

    // Find the user whose support code matches and has not expired
    const targetUser = await prisma.user.findFirst({
      where: {
        supportCode: cleanCode,
        supportCodeExpiresAt: {
          gt: now,
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Invalid or expired support access code. Codes expire after 10 minutes." },
        { status: 401 }
      );
    }

    // Calculate remaining seconds
    const remainingMs = targetUser.supportCodeExpiresAt
      ? targetUser.supportCodeExpiresAt.getTime() - now.getTime()
      : 600000;
    const remainingSeconds = Math.max(Math.floor(remainingMs / 1000), 60);

    // Create session response logging support staff in as the target member
    const response = NextResponse.json({
      success: true,
      message: `Diagnostic session established for member ${targetUser.username}`,
      targetUser: {
        id: targetUser.id,
        username: targetUser.username,
        avatar: targetUser.avatar,
      },
      expiresInSeconds: remainingSeconds,
    });

    // Set cookie valid for the remainder of the 10-minute code
    response.cookies.set("roleflow_user_id", targetUser.id, {
      path: "/",
      httpOnly: true,
      maxAge: remainingSeconds,
      sameSite: "lax",
      ...(process.env.NODE_ENV === "production" ? { domain: ".roleflow.site" } : {}),
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
