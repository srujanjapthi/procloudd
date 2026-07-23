import { createHmac, timingSafeEqual } from "node:crypto";
import env from "@/config/env.config.js";

export function hash(value: string): string {
  return createHmac("sha256", env.OTP_HMAC_SECRET).update(value).digest("hex");
}

export function verify(value: string, hashed: string): boolean {
  const computed = hash(value);
  const computedBuffer = Buffer.from(computed);
  const hashedBuffer = Buffer.from(hashed);

  if (computedBuffer.length !== hashedBuffer.length) {
    return false;
  }

  return timingSafeEqual(computedBuffer, hashedBuffer);
}
