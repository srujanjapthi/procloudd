export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export const ErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: ErrorCode;
  errors?: ApiErrorDetail[];
}
