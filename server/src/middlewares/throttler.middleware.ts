import type { RequestHandler } from "express";
import { createThrottle } from "@/common/lib/throttler/throttler.util.js";
import { throttlerPolicies } from "@/config/throttler.config.js";

type ThrottlerName = keyof typeof throttlerPolicies;

const throttlers = Object.fromEntries(
  Object.entries(throttlerPolicies).map(([name, policy]) => [
    name,
    createThrottle(name, policy),
  ])
) as Record<ThrottlerName, RequestHandler>;

export const {
  general: generalThrottle,
  auth: authThrottle,
  otp: otpThrottle,
  oauth: oauthThrottle,
  upload: uploadThrottle,
  fileOps: fileOperationsThrottle,
  download: downloadThrottle,
  directoryOps: directoryOperationsThrottle,
  userMgmt: userManagementThrottle,
  availability: availabilityThrottle,
  read: readOperationsThrottle,
  logout: logoutThrottle,
  public: publicThrottle,
} = throttlers;
