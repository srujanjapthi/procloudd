import { createClient } from "redis";
import { isDevelopment } from "@/common/utils/node-env.util.js";
import env from "@/config/env.config.js";

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on("error", (error) => {
  console.error("Redis client error:", error);
});

redisClient.on("connect", () => {
  if (isDevelopment()) {
    console.log("Redis client connected");
  }
});

redisClient.on("end", () => {
  if (isDevelopment()) {
    console.log("Redis client disconnected");
  }
});

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
}
