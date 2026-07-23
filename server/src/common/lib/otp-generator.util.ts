import { randomInt } from "node:crypto";

export function generateOtp(digits: number): string {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return randomInt(min, max + 1).toString();
}
