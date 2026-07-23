import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { Request, RequestHandler } from "express";
import {
  RateLimiterConfig,
  type RateLimiterPolicy,
} from "@/config/rate-limiter.config.js";
import { redisClient } from "@/config/redis.config.js";
import ROUTES from "@/common/constants/routes.constant.js";
import { ErrorCode } from "@/common/http/api-response.interface.js";

export function createLimiter(
  name: string,
  policy: RateLimiterPolicy
): RequestHandler {
  return rateLimit({
    windowMs: policy.windowMs,
    max: policy.max,
    message: {
      success: false,
      message: policy.message,
      code: ErrorCode.RATE_LIMITED,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = req.user?.id || RateLimiterConfig.anonymousUserKey;
      const safeIp = ipKeyGenerator(req.ip ?? "");
      return `${safeIp}:${userId}`;
    },
    skip: (req: Request) => req.path === ROUTES.health,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: `${RateLimiterConfig.keyPrefix}:${name}:`,
    }),
    ...policy.options,
  });
}
