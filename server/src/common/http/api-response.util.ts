import { StatusCodes } from "http-status-codes";
import type { Response } from "express";
import type {
  ErrorResponse,
  SuccessResponse,
} from "./api-response.interface.js";
import type { PaginationMeta } from "@/common/pagination/pagination.interface.js";
import type AppError from "@/common/error/app.error.js";

export function success<T>(
  res: Response,
  data: T,
  options: {
    message?: string;
    status?: StatusCodes;
    meta?: PaginationMeta;
  } = {}
) {
  const { message, status = StatusCodes.OK, meta } = options;
  const body: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
  return res.status(status).json(body);
}

export function error(res: Response, err: AppError) {
  const body: ErrorResponse = {
    success: false,
    message: err.message,
    code: err.code,
    ...(err.errors.length > 0 && { errors: err.errors }),
  };
  return res.status(err.statusCode).json(body);
}
