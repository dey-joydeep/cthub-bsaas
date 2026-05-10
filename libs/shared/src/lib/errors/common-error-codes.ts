/**
 * Common (non-domain-specific) error codes used across features.
 */
export const COMMON_ERROR_CODES = {
  VALIDATION: 'error.validation',
} as const;

export type CommonErrorCode = (typeof COMMON_ERROR_CODES)[keyof typeof COMMON_ERROR_CODES];

