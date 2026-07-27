import type { CookieOptions, Response } from "express";
import { isProduction } from "@/common/utils/node-env.util.js";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: isProduction() ? "none" : "lax",
  secure: isProduction(),
};

export function setCookie(
  res: Response,
  key: string,
  value: string,
  options: CookieOptions = {}
): Response {
  return res.cookie(key, value, {
    ...baseCookieOptions,
    ...options,
  });
}

export function clearCookie(res: Response, key: string): Response {
  return res.clearCookie(key, baseCookieOptions);
}
