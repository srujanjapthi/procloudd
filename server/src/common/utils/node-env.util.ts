import env from "@/config/env.config.js";

export function isDevelopment(): boolean {
  return env.NODE_ENV !== "production";
}

export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}
