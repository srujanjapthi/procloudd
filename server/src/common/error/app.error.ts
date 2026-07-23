import {
  ErrorCode,
  type ErrorDetail,
} from "@/common/http/api-response.interface.js";
import { StatusCodes } from "http-status-codes";

class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly errors: ErrorDetail[];
  readonly isOperational = true;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    errors: ErrorDetail[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: ErrorDetail[]) {
    return new AppError(
      message,
      StatusCodes.BAD_REQUEST,
      ErrorCode.BAD_REQUEST,
      errors
    );
  }

  static validationError(errors: ErrorDetail[], message = "Validation failed") {
    return new AppError(
      message,
      StatusCodes.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      errors
    );
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(
      message,
      StatusCodes.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, StatusCodes.FORBIDDEN, ErrorCode.FORBIDDEN);
  }

  static notFound(message = "Not found") {
    return new AppError(message, StatusCodes.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  static conflict(message: string) {
    return new AppError(message, StatusCodes.CONFLICT, ErrorCode.CONFLICT);
  }

  static rateLimited(message = "Too many requests") {
    return new AppError(
      message,
      StatusCodes.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMITED
    );
  }
}

export default AppError;
