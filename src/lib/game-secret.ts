import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

/** Secrets look like rfs_<43 chars>. Shown to the owner once; only the hash is stored. */
export function generateGameSecret(): string {
  return `rfs_${randomBytes(32).toString("base64url")}`;
}

export function hashGameSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Constant-time check of a bearer token against the community's stored secret hash. */
export async function verifyGameSecret(guildId: string, provided: string | null | undefined): Promise<boolean> {
  if (!provided) return false;
  const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { staffGameSecretHash: true } });
  if (!guild?.staffGameSecretHash) return false;
  const a = Buffer.from(hashGameSecret(provided), "hex");
  const b = Buffer.from(guild.staffGameSecretHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
