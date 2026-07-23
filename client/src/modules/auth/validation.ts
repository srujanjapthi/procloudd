import { z } from "zod";
import APP_CONFIG from "@/constants/config";

const usernameSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(
      `^[a-z0-9_-]{${APP_CONFIG.username.minLength},${APP_CONFIG.username.maxLength}}$`
    ),
    `Username must be ${APP_CONFIG.username.minLength}-${APP_CONFIG.username.maxLength} characters and can only contain lowercase letters, numbers, underscores, and hyphens.`
  );

const nameSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, "Last name is required"),
});

const passwordComplexityRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

const newPasswordSchema = z
  .string()
  .min(
    APP_CONFIG.password.minLength,
    `Password must be at least ${APP_CONFIG.password.minLength} characters`
  )
  .max(
    APP_CONFIG.password.maxLength,
    `Password must be at most ${APP_CONFIG.password.maxLength} characters`
  )
  .regex(
    passwordComplexityRegex,
    "Password must include an uppercase letter, a lowercase letter, a number, and a special character"
  );
const existingPasswordSchema = z.string().min(1, "Enter your password");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: existingPasswordSchema,
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: usernameSchema,
    name: nameSchema,
    email: z.email("Enter a valid email address"),
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z
  .object({
    email: z.email("Enter a valid email address"),
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: existingPasswordSchema,
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, "Enter your password"),
  code: z
    .string()
    .min(
      APP_CONFIG.totp.codeLength,
      "Enter a code from your app or a recovery code"
    ),
});
export type DisableTwoFactorFormValues = z.infer<typeof disableTwoFactorSchema>;

export const regenerateRecoveryCodesSchema = z.object({
  password: z.string().min(1, "Enter your password"),
  code: z
    .string()
    .min(
      APP_CONFIG.totp.codeLength,
      "Enter a code from your app or a recovery code"
    ),
});
export type RegenerateRecoveryCodesFormValues = z.infer<
  typeof regenerateRecoveryCodesSchema
>;

export const updateProfileSchema = z.object({
  username: usernameSchema,
  name: nameSchema,
});
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const completeOAuthSignupSchema = z
  .object({
    username: usernameSchema,
    name: nameSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type CompleteOAuthSignupFormValues = z.infer<
  typeof completeOAuthSignupSchema
>;
