import { z } from "zod";
import AppConfig from "@/config/app.config.js";

export const verifyTwoFactorSetupSchema = z.object({
  code: z.string().length(AppConfig.totp.codeLength),
});
export type VerifyTwoFactorSetupInput = z.infer<
  typeof verifyTwoFactorSetupSchema
>;

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1),
  code: z.string().min(AppConfig.totp.codeLength),
});
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>;

export const regenerateRecoveryCodesSchema = z.object({
  password: z.string().min(1),
  code: z.string().min(AppConfig.totp.codeLength),
});
export type RegenerateRecoveryCodesInput = z.infer<
  typeof regenerateRecoveryCodesSchema
>;
