/**
 * Standard API response metadata.
 */
export interface ApiResponseMeta {
  correlationId?: string;
}

/**
 * Cursor pagination metadata for list endpoints.
 */
export interface CursorPaginationMeta {
  page: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

/**
 * Legacy offset pagination metadata used by existing endpoints.
 */
export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type PaginationMeta = CursorPaginationMeta | OffsetPaginationMeta;

/**
 * Standard API response format.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
  status?: number;
  meta?: ApiResponseMeta;
}

/**
 * Standard error response format
 */
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
  isOperational?: boolean;
}

/**
 * Standard pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Standard pagination response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiResponseMeta & PaginationMeta;
}
