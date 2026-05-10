/**
 * Theme-related constants
 */

export const THEME_ERRORS = {
  NOT_FOUND: 'Theme not found',
  DUPLICATE_NAME: 'A theme with this name already exists',
  DEFAULT_THEME_DELETION: 'Cannot delete default theme',
  INVALID_ID: 'Invalid theme ID',
} as const;

export const THEME_MESSAGES = {
  CREATED: 'Theme created successfully',
  UPDATED: 'Theme updated successfully',
  DELETED: 'Theme deleted successfully',
  LIST: 'Themes retrieved successfully',
  DETAIL: 'Theme details retrieved successfully',
} as const;

export const THEME_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  STAFF: 'staff',
  CUSTOMER: 'customer',
} as const;

export const DEFAULT_THEME_LIMIT = 10;
export const MAX_THEME_LIMIT = 100;
