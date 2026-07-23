import {
  generateSecret as generateBase32Secret,
  generateURI,
  verify,
} from "otplib";
import AppConfig from "@/config/app.config.js";

export function generateSecret(): string {
  return generateBase32Secret();
}

export async function verifyCode(
  code: string,
  secret: string
): Promise<boolean> {
  try {
    const result = await verify({
      secret,
      token: code,
      epochTolerance: AppConfig.totp.epochTolerance,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export function getKeyUri(accountName: string, secret: string): string {
  return generateURI({
    issuer: AppConfig.totp.issuer,
    label: accountName,
    secret,
  });
}
