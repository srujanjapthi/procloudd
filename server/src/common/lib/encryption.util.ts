import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import env from "@/config/env.config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const key = Buffer.from(env.TOTP_ENCRYPTION_KEY, "hex");

export function encrypt(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext]
    .map((buffer) => buffer.toString("hex"))
    .join(":");
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted value");
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
