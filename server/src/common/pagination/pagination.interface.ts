export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}
