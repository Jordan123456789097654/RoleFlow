import { createPublicKey, verify } from "crypto";

// Ed25519 SubjectPublicKeyInfo prefix; Discord sends the raw 32-byte key as hex.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** Checks Discord's Ed25519 signature over timestamp + body. */
export function validSignature(
  body: string,
  publicKeyHex: string | null,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!publicKeyHex || !signature || !timestamp) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyHex, "hex")]),
      format: "der",
      type: "spki",
    });
    return verify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
