import { StatusCodes } from "http-status-codes";
import type { NextFunction, Request, Response } from "express";
import AppError from "@/common/error/app.error.js";
import { ErrorCode } from "@/common/http/api-response.interface.js";
import * as ApiResponse from "@/common/http/api-response.util.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    ApiResponse.error(res, err);
    return;
  }

  console.error(err);

  const fallback = new AppError(
    "Something went wrong",
    StatusCodes.INTERNAL_SERVER_ERROR,
    ErrorCode.INTERNAL_ERROR
  );
  ApiResponse.error(res, fallback);
}
