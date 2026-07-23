import type { NextFunction, Request, Response } from "express";
import { authorization } from "@/common/auth/authorization.util.js";
import type { Permission } from "@/common/constants/permissions.constant.js";

export function authorize(permission: Permission) {
  return function authorizeMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    try {
      authorization().user(req.user).can(permission).check();
      next();
    } catch (error) {
      next(error);
    }
  };
}
