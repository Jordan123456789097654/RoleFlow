import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

/**
 * Derives a 256-bit key using HKDF from APP_SECRET or ENCRYPTION_KEY.
 */
function getVaultKey(): Buffer {
  const secret = process.env.APP_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error("APP_SECRET or ENCRYPTION_KEY must be set with at least 16 characters.");
  }
  return Buffer.from(hkdfSync("sha256", secret, "rankhub-vault-secrets", "aes-256-gcm", 32));
}

/**
 * Encrypts a plaintext string (e.g. Open Cloud API Key or .ROBLOSECURITY cookie) using AES-256-GCM.
 * Prepends 'enc:v1:' prefix and is idempotent if already encrypted.
 */
export function encryptVaultSecret(plain: string): string {
  if (!plain) return "";
  if (plain.startsWith(PREFIX)) return plain;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getVaultKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return PREFIX + Buffer.concat([iv, authTag, enc]).toString("base64url");
}

/**
 * Decrypts a vault ciphertext encrypted with AES-256-GCM.
 * If null/empty returns empty string.
 * If not matching 'enc:v1:' prefix, returns raw value (legacy fallback).
 */
export function decryptVaultSecret(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored.trim();

  const raw = Buffer.from(stored.slice(PREFIX.length), "base64url");
  if (raw.length < 28) {
    throw new Error("Invalid encrypted payload length.");
  }

  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", getVaultKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8").trim();
}
