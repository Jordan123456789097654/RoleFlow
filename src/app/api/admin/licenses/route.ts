import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function generateSecureLicenseKey(tier: string): string {
  const prefix = `RF-${tier.toUpperCase().slice(0, 4)}`;
  const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const p3 = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${p1}-${p2}-${p3}`;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const licenses = await prisma.licenseKey.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(licenses);
  } catch (err) {
    console.error("Fetch license keys error:", err);
    return NextResponse.json({ error: "Failed to fetch license keys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const body = await request.json();
    const tier = (body.tier || "PRO").toUpperCase();
    const scope = (body.scope || "GUILD").toUpperCase();
    const durationDays = body.durationDays ? parseInt(body.durationDays, 10) : null;
    const maxUses = body.maxUses ? Math.max(1, parseInt(body.maxUses, 10)) : 1;
    const note = body.note ? String(body.note).trim() : null;
    
    // Custom key or auto-generate
    const key = body.customKey && String(body.customKey).trim()
      ? String(body.customKey).trim().toUpperCase()
      : generateSecureLicenseKey(tier);

    // Check if key already exists
    const existing = await prisma.licenseKey.findUnique({ where: { key } });
    if (existing) {
      return NextResponse.json({ error: "A license key with this code already exists" }, { status: 400 });
    }

    const license = await prisma.licenseKey.create({
      data: {
        key,
        tier,
        scope,
        durationDays,
        maxUses,
        note,
      },
    });

    return NextResponse.json({ success: true, license });
  } catch (err) {
    console.error("Create license key error:", err);
    return NextResponse.json({ error: "Failed to generate license key" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { id, isRevoked, note } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "License ID is required" }, { status: 400 });
    }

    const updated = await prisma.licenseKey.update({
      where: { id },
      data: {
        ...(typeof isRevoked === "boolean" ? { isRevoked } : {}),
        ...(note !== undefined ? { note: String(note).trim() } : {}),
      },
    });

    return NextResponse.json({ success: true, license: updated });
  } catch (err) {
    console.error("Update license key error:", err);
    return NextResponse.json({ error: "Failed to update license key" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "License ID is required" }, { status: 400 });
    }

    await prisma.licenseKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete license key error:", err);
    return NextResponse.json({ error: "Failed to delete license key" }, { status: 500 });
  }
}
