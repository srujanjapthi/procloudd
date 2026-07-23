import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import AppError from "@/common/error/app.error.js";
import * as ZodError from "@/common/error/zod.error.js";

export function validateQuery<T>(schema: ZodType<T>) {
  return function validateQueryMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
  ) {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(AppError.validationError(ZodError.format(result.error)));
    }

    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
    });
    next();
  };
}
