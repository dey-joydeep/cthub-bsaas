/**
 * User-related constants
 */

export const USER_ERROR_MESSAGES = {
  NOT_FOUND: 'User not found',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  PASSWORD_MISMATCH: 'Current password is incorrect',
  LAST_ADMIN: 'Cannot remove the last admin user',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_PASSWORD:
    'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  UPDATE_REQUIRES_CURRENT_PASSWORD: 'Current password is required to update sensitive information',
  MISSING_FIELDS: 'At least one field must be provided for update',
} as const;

export const USER_VALIDATION = {
  PASSWORD_PATTERN: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\da-zA-Z]).{8,}$',
  EMAIL_PATTERN: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
  PHONE_PATTERN: '^\\+[1-9]\\d{1,14}$',
  PASSWORD_SALT_ROUNDS: 10,
} as const;

export const USER_DEFAULTS = {
  DEFAULT_ROLE: 'CUSTOMER',
  PAGINATION_LIMIT: 10,
  PAGINATION_OFFSET: 0,
} as const;
