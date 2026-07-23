import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import AppError from "@/common/error/app.error.js";
import * as ZodError from "@/common/error/zod.error.js";
import { sanitize } from "@/common/lib/sanitize.util.js";

export function validateBody<T>(schema: ZodType<T>) {
  return function validateBodyMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(AppError.validationError(ZodError.format(result.error)));
    }
    req.body = sanitize(result.data);
    next();
  };
}
