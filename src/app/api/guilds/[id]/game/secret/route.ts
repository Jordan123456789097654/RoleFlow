import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { generateGameSecret, hashGameSecret } from "@/lib/game-secret";

export const dynamic = "force-dynamic";

/** Whether a game secret exists. Never returns the secret or its hash. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;
  const guild = await prisma.guild.findUnique({
    where: { id: params.id },
    select: { staffGameSecretHash: true, staffGameSecretRotatedAt: true },
  });
  return NextResponse.json({
    configured: Boolean(guild?.staffGameSecretHash),
    rotatedAt: guild?.staffGameSecretRotatedAt ?? null,
  });
}

/** Generates a new secret, invalidating the old one. The plaintext is returned once. Owner or site admin only. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const secret = generateGameSecret();
  await prisma.guild.update({
    where: { id: params.id },
    data: { staffGameSecretHash: hashGameSecret(secret), staffGameSecretRotatedAt: new Date() },
  });
  return NextResponse.json({ secret });
}
