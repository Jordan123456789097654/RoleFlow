import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionValue } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isSiteAdminUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSiteAdmin: true, siteRole: true },
  });
  if (!user || !isSiteAdminUser(user)) return null;
  return user;
}

async function readState() {
  const [active, target, sent] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "lockdown_active" } }),
    prisma.systemSetting.findUnique({ where: { key: "lockdown_countdown" } }),
    prisma.systemSetting.findUnique({ where: { key: "lockdown_broadcast_sent" } }),
  ]);
  return {
    active: active?.value === "true",
    targetDate: target?.value || null,
    launchEmailsSent: sent?.value === "true",
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await readState());
}

/**
 * POST { action: "save", targetDate: ISO string | null, active: boolean }
 * POST { action: "lockdown_off" }
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  if (body.action === "lockdown_off") {
    await prisma.systemSetting.upsert({
      where: { key: "lockdown_active" },
      update: { value: "false" },
      create: { key: "lockdown_active", value: "false" },
    });
    return NextResponse.json({ success: true, ...(await readState()) });
  }

  if (body.action !== "save") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  let targetIso: string | null = null;
  if (body.targetDate) {
    const parsed = new Date(body.targetDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Enter a valid date and time." }, { status: 400 });
    }
    targetIso = parsed.toISOString();
  }

  const active = body.active === true;
  if (!targetIso) {
    return NextResponse.json({ error: "Set a launch date and time before saving." }, { status: 400 });
  }

  await prisma.systemSetting.upsert({
    where: { key: "lockdown_countdown" },
    update: { value: targetIso },
    create: { key: "lockdown_countdown", value: targetIso },
  });
  await prisma.systemSetting.upsert({
    where: { key: "lockdown_active" },
    update: { value: active ? "true" : "false" },
    create: { key: "lockdown_active", value: active ? "true" : "false" },
  });

  // A new future launch time should send the launch email again when it arrives.
  if (new Date(targetIso).getTime() > Date.now()) {
    await prisma.systemSetting.upsert({
      where: { key: "lockdown_broadcast_sent" },
      update: { value: "false" },
      create: { key: "lockdown_broadcast_sent", value: "false" },
    });
  }

  return NextResponse.json({ success: true, ...(await readState()) });
}
