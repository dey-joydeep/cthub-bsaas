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

export type CommonInfoMessageKey = (typeof COMMON_MESSAGE_KEYS)['INFO'][keyof (typeof COMMON_MESSAGE_KEYS)['INFO']];
export type CommonWarnMessageKey = (typeof COMMON_MESSAGE_KEYS)['WARN'][keyof (typeof COMMON_MESSAGE_KEYS)['WARN']];
export type CommonErrorMessageKey = (typeof COMMON_MESSAGE_KEYS)['ERROR'][keyof (typeof COMMON_MESSAGE_KEYS)['ERROR']];
export type CommonMessageKey = CommonInfoMessageKey | CommonWarnMessageKey | CommonErrorMessageKey;
