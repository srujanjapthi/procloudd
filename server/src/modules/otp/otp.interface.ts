import type { OtpPurpose } from "@/models/otp.model.js";

export interface UpsertOtpInput {
  email: string;
  code: string;
  purpose: OtpPurpose;
}
