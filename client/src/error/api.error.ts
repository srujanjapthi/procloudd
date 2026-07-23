import type { ApiErrorDetail, ErrorCode } from "@/types/api";

class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly errors: ApiErrorDetail[];

  constructor(
    message: string,
    code: ErrorCode,
    status: number,
    errors: ApiErrorDetail[] = []
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

export default ApiError;

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  return error instanceof ApiError ? error.message : fallback;
}
