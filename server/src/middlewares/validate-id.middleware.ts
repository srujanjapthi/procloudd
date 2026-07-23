import type { NextFunction, Request, Response } from "express";
import * as Db from "@/common/lib/db.util.js";
import AppError from "@/common/error/app.error.js";

export function validateId(
  _req: Request,
  _res: Response,
  next: NextFunction,
  id: string
) {
  if (!Db.isValidId(id)) {
    return next(AppError.badRequest(`Invalid ID: ${id}`));
  }
  next();
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateSessionId(
  _req: Request,
  _res: Response,
  next: NextFunction,
  sessionId: string
) {
  if (!uuidRegex.test(sessionId)) {
    return next(AppError.badRequest(`Invalid session ID: ${sessionId}`));
  }
  next();
}
