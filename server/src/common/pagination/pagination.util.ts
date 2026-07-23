import type {
  PaginationMeta,
  PaginationParams,
} from "./pagination.interface.js";

export function toParams(page: number, limit: number): PaginationParams {
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
}
