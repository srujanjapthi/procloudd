import type { Options } from "express-rate-limit";
import type { Request } from "express";
import * as Duration from "@/common/lib/duration.util.js";

export const RateLimiterConfig = {
  keyPrefix: "rl",
  anonymousUserKey: "anonymous",
  unknownEmailKey: "unknown",
} as const;

function emailKeyGenerator(req: Request): string {
  const email = (req.body as { email?: unknown })?.email;
  return typeof email === "string"
    ? email.trim().toLowerCase()
    : RateLimiterConfig.unknownEmailKey;
}

export interface RateLimiterPolicy {
  windowMs: number;
  max: number;
  message: string;
  options?: Partial<Options>;
}

export const rateLimiterPolicies = {
  general: {
    windowMs: Duration.toMs("15m"),
    max: 1000,
    message: "Too many requests, please try again later.",
  },
  auth: {
    windowMs: Duration.toMs("15m"),
    max: 10,
    message: "Too many authentication attempts. Please try again later.",
    options: { skipSuccessfulRequests: true },
  },
  otpIp: {
    windowMs: Duration.toMs("15m"),
    max: 20,
    message: "Too many OTP requests. Please try again later.",
  },
  otpEmail: {
    windowMs: Duration.toMs("15m"),
    max: 5,
    message: "Too many OTP requests for this email. Please try again later.",
    options: { keyGenerator: emailKeyGenerator },
  },
  oauth: {
    windowMs: Duration.toMs("15m"),
    max: 20,
    message: "Too many OAuth attempts, please try again later.",
  },
  upload: {
    windowMs: Duration.toMs("1m"),
    max: 10,
    message: "Too many file uploads, please wait before uploading again.",
  },
  fileOps: {
    windowMs: Duration.toMs("1m"),
    max: 100,
    message: "Too many file operations, please slow down.",
  },
  directoryOps: {
    windowMs: Duration.toMs("1m"),
    max: 50,
    message: "Too many directory operations, please slow down.",
  },
  userMgmt: {
    windowMs: Duration.toMs("15m"),
    max: 50,
    message: "Too many user management operations, try again later.",
  },
  availability: {
    windowMs: Duration.toMs("5m"),
    max: 20,
    message: "Too many requests. Please try again later.",
  },
  read: {
    windowMs: Duration.toMs("1m"),
    max: 200,
    message: "Too many read requests, please slow down.",
  },
  logout: {
    windowMs: Duration.toMs("5m"),
    max: 20,
    message: "Too many logout attempts, please try again later.",
  },
  public: {
    windowMs: Duration.toMs("1m"),
    max: 100,
    message: "Too many requests, please slow down.",
  },
} as const satisfies Record<string, RateLimiterPolicy>;
