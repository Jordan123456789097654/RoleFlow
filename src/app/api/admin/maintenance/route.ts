import { isFounderUser } from "@/lib/roles";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "maintenance_mode" },
    });
    const messageSetting = await prisma.systemSetting.findUnique({
      where: { key: "maintenance_message" },
    });

    return NextResponse.json({
      enabled: setting?.value === "true",
      message: messageSetting?.value || "RoleFlow is currently undergoing scheduled platform maintenance. Please check back shortly.",
    });
  } catch (err) {
    return NextResponse.json({ enabled: false, message: "" });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = !!currentUser && isFounderUser(currentUser);

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder authorization required" }, { status: 403 });
    }

    const { enabled, message } = await request.json();

    await prisma.systemSetting.upsert({
      where: { key: "maintenance_mode" },
      update: { value: enabled ? "true" : "false" },
      create: { key: "maintenance_mode", value: enabled ? "true" : "false" },
    });

    if (message !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "maintenance_message" },
        update: { value: String(message) },
        create: { key: "maintenance_message", value: String(message) },
      });
    }

    return NextResponse.json({
      success: true,
      enabled: !!enabled,
      message: message || "Maintenance setting updated.",
    });
  } catch (err) {
    console.error("Maintenance toggle error:", err);
    return NextResponse.json({ error: "Failed to update maintenance mode" }, { status: 500 });
  }
}
