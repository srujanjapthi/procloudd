import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ipKeyGenerator } from "express-rate-limit";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  ThrottlerConfig,
  type ThrottlerPolicy,
} from "@/config/throttler.config.js";
import { redisClient } from "@/config/redis.config.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const THROTTLE_SCRIPT = readFileSync(
  path.join(currentDir, "throttler.lua"),
  "utf-8"
);

export function createThrottle(
  prefix: string,
  policy: ThrottlerPolicy
): RequestHandler {
  const ttlSeconds =
    Math.ceil((policy.waitTime * policy.delayAfter * 2) / 1000) ||
    ThrottlerConfig.fallbackTtlSeconds;

  return async (req: Request, _res: Response, next: NextFunction) => {
    const throttleKey =
      policy.useUserId && req.user?.id
        ? `${ThrottlerConfig.keyPrefix}:${prefix}:${req.user.id}`
        : `${ThrottlerConfig.keyPrefix}:${prefix}:${ipKeyGenerator(req.ip ?? "")}`;

    const delay = (await redisClient.eval(THROTTLE_SCRIPT, {
      keys: [throttleKey],
      arguments: [
        String(Date.now()),
        String(policy.waitTime),
        String(policy.delayAfter),
        String(ttlSeconds),
      ],
    })) as number;

    if (delay <= 0) {
      next();
    } else {
      setTimeout(next, delay);
    }
  };
}
