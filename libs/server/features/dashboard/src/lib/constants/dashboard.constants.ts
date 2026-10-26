/**
 * Dashboard-related constants
 */

export const DASHBOARD_DEFAULTS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  CACHE_TTL: 300, // 5 minutes in seconds
} as const;

export const DASHBOARD_CACHE_KEYS = {
  STATS: 'dashboard:stats',
  REVENUE: 'dashboard:revenue',
  TOP_PRODUCTS: 'dashboard:top-products',
  PRODUCT_SALES: 'dashboard:product-sales',
} as const;

export const DASHBOARD_ERROR_MESSAGES = {
  INVALID_DATE_RANGE: 'Invalid date range: start date must be before end date',
  INVALID_LIMIT: `Limit must be between 1 and ${DASHBOARD_DEFAULTS.MAX_LIMIT}`,
  UNAUTHORIZED: 'You are not authorized to access this dashboard',
} as const;
