import type { NextFunction, Request, Response } from "express";
import AppError from "@/common/error/app.error.js";
import * as Cookie from "@/common/lib/cookie.util.js";
import Sessions from "@/services/session.service.js";
import User from "@/models/user.model.js";
import AppConfig from "@/config/app.config.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = req.signedCookies[AppConfig.session.cookieName] as
    string | undefined;
  if (!sessionId) {
    throw AppError.unauthorized();
  }

  const session = await Sessions.getSession(sessionId);
  if (!session) {
    Cookie.clearCookie(res, AppConfig.session.cookieName);
    throw AppError.unauthorized();
  }

  const user = await User.findById(session.userId).lean();
  if (!user) {
    Cookie.clearCookie(res, AppConfig.session.cookieName);
    throw AppError.unauthorized();
  }

  if (user.status !== "active") {
    throw AppError.forbidden("Your account is not active.");
  }

  req.user = { id: user._id.toString(), role: user.role };
  next();
}
