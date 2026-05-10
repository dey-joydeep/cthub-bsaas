/**
 * Common (cross-cutting) i18n message keys grouped by semantics.
 */
export const COMMON_MESSAGE_KEYS = {
  INFO: {
  },
  WARN: {
  },
  ERROR: {
    VALIDATION: 'error.validation',
    NOT_IMPLEMENTED: 'error.not_implemented',
    CSRF_FAILED: 'error.security.csrf_failed',
  },
} as const;

export type CommonErrorMessageKey = (typeof COMMON_MESSAGE_KEYS)['ERROR'][keyof (typeof COMMON_MESSAGE_KEYS)['ERROR']];
export type CommonMessageKey = CommonErrorMessageKey;