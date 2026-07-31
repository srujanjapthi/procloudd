import { z } from "zod";
import * as ZodError from "@/common/error/zod.error.js";
import type { EmailSenderConfig } from "@/common/email/email-sender.factory.js";

const envSchema = z
  .object({
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

    EMAIL_PROVIDER: z.enum(["nodemailer", "resend"]),
    NODEMAILER_HOST: z.string().min(1).optional(),
    NODEMAILER_PORT: z.coerce.number().int().positive().optional(),
    NODEMAILER_USER: z.string().min(1).optional(),
    NODEMAILER_PASSWORD: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),

    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_S3_BUCKET: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.EMAIL_PROVIDER === "nodemailer") {
      for (const field of [
        "NODEMAILER_HOST",
        "NODEMAILER_PORT",
        "NODEMAILER_USER",
        "NODEMAILER_PASSWORD",
      ] as const) {
        if (!data[field]) {
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: `Required when EMAIL_PROVIDER is "nodemailer"`,
          });
        }
      }
    }

    if (data.EMAIL_PROVIDER === "resend" && !data.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: `Required when EMAIL_PROVIDER is "resend"`,
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = ZodError.format(result.error)
    .map(({ field, message }) => `  - ${field}: ${message}`)
    .join("\n");
  console.error(`Invalid environment variables:\n${errors}`);
  process.exit(1);
}

const env = result.data;

const email: EmailSenderConfig =
  env.EMAIL_PROVIDER === "resend"
    ? { provider: "resend", apiKey: env.RESEND_API_KEY!, from: env.EMAIL_FROM }
    : {
        provider: "nodemailer",
        host: env.NODEMAILER_HOST!,
        port: env.NODEMAILER_PORT!,
        user: env.NODEMAILER_USER!,
        password: env.NODEMAILER_PASSWORD!,
        from: env.EMAIL_FROM,
      };

export default { ...env, email };
