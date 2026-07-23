import { z } from "zod";
import { OtpPurposeSchema } from "@/models/otp.model.js";
import AppConfig from "@/config/app.config.js";

export const sendOtpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  purpose: OtpPurposeSchema,
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  code: z.string().length(AppConfig.otp.digits),
  purpose: OtpPurposeSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
