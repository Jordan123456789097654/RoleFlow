import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please login with Discord first" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const rawKey = body.key ? String(body.key).trim().toUpperCase() : "";
    const guildId = body.guildId ? String(body.guildId).trim() : null;

    if (!rawKey) {
      return NextResponse.json({ error: "Please enter a valid license key" }, { status: 400 });
    }

    // Lookup license key
    const license = await prisma.licenseKey.findUnique({
      where: { key: rawKey },
    });

    if (!license) {
      return NextResponse.json({ error: "Invalid license key. Please check the code and try again." }, { status: 404 });
    }

    if (license.isRevoked) {
      return NextResponse.json({ error: "This license key has been revoked by platform administration." }, { status: 403 });
    }

    if (license.usesCount >= license.maxUses) {
      return NextResponse.json({ error: "This license key has already reached its maximum redemptions." }, { status: 400 });
    }

    if (license.expiresAt && new Date() > license.expiresAt) {
      return NextResponse.json({ error: "This license key has expired." }, { status: 400 });
    }

    // Community / Guild Redemption
    if (license.scope === "GUILD") {
      if (!guildId) {
        return NextResponse.json({ error: "This is a Community License key. Please select a community to upgrade." }, { status: 400 });
      }

      const guild = await prisma.guild.findUnique({ where: { id: guildId } });
      if (!guild) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }

      // Verify user owns the community or is site admin
      const isOwner = guild.ownerId === currentUser.id || currentUser.isSiteAdmin || currentUser.id === "1046538179399929957";
      if (!isOwner) {
        return NextResponse.json({ error: "Forbidden: Only the community owner can redeem license keys for this community." }, { status: 403 });
      }

      // Calculate expiration date if duration is specified
      const licenseExpiresAt = license.durationDays
        ? new Date(Date.now() + license.durationDays * 24 * 60 * 60 * 1000)
        : null;

      // Update Guild
      await prisma.guild.update({
        where: { id: guildId },
        data: {
          plan: license.tier,
          licenseKey: license.key,
          licenseExpiresAt,
        },
      });

      // Update LicenseKey
      await prisma.licenseKey.update({
        where: { id: license.id },
        data: {
          usesCount: { increment: 1 },
          redeemedBy: guild.id,
          redeemedByName: guild.name,
          redeemedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully upgraded ${guild.name} to RoleFlow ${license.tier}!`,
        plan: license.tier,
        scope: "GUILD",
        guildName: guild.name,
        expiresAt: licenseExpiresAt,
      });
    }

    // User License Redemption
    if (license.scope === "USER") {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          plan: license.tier,
          licenseKey: license.key,
        },
      });

      await prisma.licenseKey.update({
        where: { id: license.id },
        data: {
          usesCount: { increment: 1 },
          redeemedBy: currentUser.id,
          redeemedByName: currentUser.username,
          redeemedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully activated RoleFlow ${license.tier} on your account!`,
        plan: license.tier,
        scope: "USER",
      });
    }

    return NextResponse.json({ error: "Unsupported license scope" }, { status: 400 });
  } catch (err) {
    console.error("Redeem license error:", err);
    return NextResponse.json({ error: "Failed to redeem license key" }, { status: 500 });
  }
}
