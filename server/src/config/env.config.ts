import { z } from "zod";
import * as ZodError from "@/common/error/zod.error.js";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z.url(),

  DB_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  OTP_HMAC_SECRET: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  OAUTH_SIGNUP_SECRET: z.string().min(1),
  PENDING_LOGIN_SECRET: z.string().min(1),
  GITHUB_OAUTH_STATE_SECRET: z.string().min(1),
  TOTP_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "Must be a 64-character hex string (32 bytes)"),

  NODEMAILER_HOST: z.string().min(1),
  NODEMAILER_PORT: z.coerce.number().int().positive(),
  NODEMAILER_USER: z.string().min(1),
  NODEMAILER_PASSWORD: z.string().min(1),
  EMAIL_FROM: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = ZodError.format(result.error)
    .map(({ field, message }) => `  - ${field}: ${message}`)
    .join("\n");
  console.error(`Invalid environment variables:\n${errors}`);
  process.exit(1);
}

export default result.data;
