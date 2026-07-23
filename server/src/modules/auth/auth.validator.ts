import { z } from "zod";
import { usernameSchema, nameSchema } from "@/modules/user/user.validator.js";
import AppConfig from "@/config/app.config.js";

const hmacTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/, "Invalid token");

const passwordComplexityRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

const newPasswordSchema = z
  .string()
  .min(AppConfig.password.minLength)
  .max(AppConfig.password.maxLength)
  .regex(passwordComplexityRegex);
const existingPasswordSchema = z.string().min(1);
const otpCodeSchema = z.string().length(AppConfig.otp.digits);

export const registerSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
  email: z.email().trim().toLowerCase(),
  password: newPasswordSchema,
  code: otpCodeSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1),
  password: existingPasswordSchema,
  code: z.string().min(AppConfig.otp.digits),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const loginPrecheckSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1),
  password: existingPasswordSchema,
});
export type LoginPrecheckInput = z.infer<typeof loginPrecheckSchema>;

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const githubLoginSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
export type GithubLoginInput = z.infer<typeof githubLoginSchema>;

export const completeOAuthSignupSchema = z.object({
  token: hmacTokenSchema,
  username: usernameSchema,
  password: newPasswordSchema,
  name: nameSchema,
  avatar: z.object({ url: z.url() }).optional(),
});
export type CompleteOAuthSignupInput = z.infer<
  typeof completeOAuthSignupSchema
>;

export const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
  code: otpCodeSchema,
  newPassword: newPasswordSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: existingPasswordSchema,
  newPassword: newPasswordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resolveLoginSessionLimitSchema = z.object({
  token: hmacTokenSchema,
  sessionIdToEnd: z.string().min(1),
});
export type ResolveLoginSessionLimitInput = z.infer<
  typeof resolveLoginSessionLimitSchema
>;

export const resolveOAuthTwoFactorSchema = z.object({
  token: hmacTokenSchema,
  code: z.string().min(AppConfig.otp.digits),
});
export type ResolveOAuthTwoFactorInput = z.infer<
  typeof resolveOAuthTwoFactorSchema
>;
