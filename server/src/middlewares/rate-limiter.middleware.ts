import type { RequestHandler } from "express";
import { createLimiter } from "@/common/lib/rate-limiter.util.js";
import { rateLimiterPolicies } from "@/config/rate-limiter.config.js";

type LimiterName = keyof typeof rateLimiterPolicies;

const limiters = Object.fromEntries(
  Object.entries(rateLimiterPolicies).map(([name, policy]) => [
    name,
    createLimiter(name, policy),
  ])
) as Record<LimiterName, RequestHandler>;

export const {
  general: generalLimiter,
  auth: authLimiter,
  otpIp: otpIpLimiter,
  otpEmail: otpEmailLimiter,
  oauth: oauthLimiter,
  upload: uploadLimiter,
  fileOps: fileOperationsLimiter,
  directoryOps: directoryOperationsLimiter,
  download: downloadLimiter,
  preview: previewLimiter,
  userMgmt: userManagementLimiter,
  availability: availabilityLimiter,
  read: readOperationsLimiter,
  logout: logoutLimiter,
  public: publicLimiter,
} = limiters;
