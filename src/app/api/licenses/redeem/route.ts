import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Redeems a license key. GUILD keys upgrade a community (owner only).
 * USER keys upgrade the signed-in account. Each key is claimed atomically so it cannot exceed maxUses.
 */
export async function POST(request: Request) {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Sign in to redeem a license." }, { status: 401 });

  const { key, guildId } = await request.json();
  const code = String(key || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Enter a license key." }, { status: 400 });

  const license = await prisma.licenseKey.findUnique({ where: { key: code } });
  if (!license || license.isRevoked) return NextResponse.json({ error: "That key is invalid or has been revoked." }, { status: 404 });
  if (license.expiresAt && license.expiresAt < new Date()) return NextResponse.json({ error: "This key has expired." }, { status: 400 });

  let target: { id: string; name: string } | null = null;
  if (license.scope === "GUILD") {
    if (!guildId) return NextResponse.json({ error: "Choose the community this license is for." }, { status: 400 });
    const guild = await prisma.guild.findUnique({ where: { id: String(guildId) }, select: { id: true, name: true, ownerId: true } });
    if (!guild) return NextResponse.json({ error: "Community not found." }, { status: 404 });
    if (guild.ownerId !== userId) return NextResponse.json({ error: "Only the community owner can redeem this license." }, { status: 403 });
    target = { id: guild.id, name: guild.name };
  }

  // Claim a use atomically so two requests cannot both take the last one
  const claimed = await prisma.licenseKey.updateMany({
    where: { id: license.id, isRevoked: false, usesCount: { lt: license.maxUses } },
    data: { usesCount: { increment: 1 } },
  });
  if (claimed.count === 0) return NextResponse.json({ error: "This key has already been used." }, { status: 409 });

  const planExpiresAt = license.durationDays ? new Date(Date.now() + license.durationDays * 86_400_000) : null;
  try {
    if (target) {
      await prisma.guild.update({ where: { id: target.id }, data: { plan: license.tier, planExpiresAt } });
    } else {
      await prisma.user.update({ where: { id: userId }, data: { plan: license.tier, planExpiresAt } });
    }
  } catch (err) {
    await prisma.licenseKey.update({ where: { id: license.id }, data: { usesCount: { decrement: 1 } } });
    throw err;
  }

  const redeemedName = target?.name ?? (await prisma.user.findUnique({ where: { id: userId }, select: { username: true } }))?.username ?? null;
  await prisma.licenseKey.update({
    where: { id: license.id },
    data: { redeemedBy: target?.id ?? userId, redeemedByName: redeemedName, redeemedAt: new Date() },
  });
  await recordAudit({ actorId: userId, action: "LICENSE_REDEEM", targetId: target?.id ?? userId, details: { tier: license.tier, scope: license.scope } });

  return NextResponse.json({ success: true, tier: license.tier, scope: license.scope, expiresAt: planExpiresAt });
}
