import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionValue } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isSiteAdminUser } from "@/lib/roles";
import { getDynamicProducts, getDynamicCountdown, DEFAULT_PRODUCTS } from "@/lib/parent-site";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, countdown] = await Promise.all([
    getDynamicProducts(),
    getDynamicCountdown(),
  ]);

  return NextResponse.json({
    products,
    countdown,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body;

  if (action === "save_products") {
    const { products } = body;
    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Products must be an array." }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: "parent_products" },
      update: { value: JSON.stringify(products) },
      create: { key: "parent_products", value: JSON.stringify(products) },
    });

    return NextResponse.json({ success: true, message: "Products updated successfully." });
  }

  if (action === "reset_products") {
    await prisma.systemSetting.deleteMany({
      where: { key: "parent_products" },
    });
    return NextResponse.json({ success: true, message: "Products reset to default lineup." });
  }

  if (action === "save_countdown") {
    const { targetDate, label } = body;
    await prisma.systemSetting.upsert({
      where: { key: "parent_countdown" },
      update: { value: JSON.stringify({ targetDate: targetDate || null, label: label || null }) },
      create: { key: "parent_countdown", value: JSON.stringify({ targetDate: targetDate || null, label: label || null }) },
    });

    return NextResponse.json({ success: true, message: "Countdown updated successfully." });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
