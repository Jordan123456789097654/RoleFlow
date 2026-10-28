import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.APP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ENCRYPTION_KEY (or APP_SECRET) must be set, at least 16 characters.");
  }
  return Buffer.from(hkdfSync("sha256", secret, "roleflow-secrets", "aes-256-gcm", 32));
}

/** Encrypts a secret (e.g. a Discord bot token) for storage. Idempotent for already-encrypted values. */
export function encryptSecret(plain: string): string {
  if (plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64url");
}

/** Decrypts a stored secret. Legacy plaintext values pass through unchanged until migrated. */
export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored.trim();
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8").trim();
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
