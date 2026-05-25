/**
 * Common (cross-cutting) i18n message keys grouped by semantics.
 */
export const COMMON_MESSAGE_KEYS = {
  INFO: {},
  WARN: {},
  ERROR: {
    VALIDATION: 'error.validation',
    NOT_IMPLEMENTED: 'error.not_implemented',
    CSRF_FAILED: 'error.security.csrf_failed',
    UNHANDLED: 'common.error.unhandled',
    UNKNOWN: 'common.error.unknown',
    HTTP_EXCEPTION: 'common.error.http_exception',
    BAD_REQUEST: 'common.error.bad_request',
    UNAUTHORIZED: 'common.error.unauthorized',
    FORBIDDEN_PERMISSION: 'common.error.forbidden.permission',
    FORBIDDEN_SCOPE: 'common.error.forbidden.scope',
    NOT_FOUND: 'common.error.not_found',
    CONFLICT: 'common.error.conflict',
    RATE_LIMITED: 'common.error.rate_limited',
  },
} as const;

export type CommonErrorMessageKey = (typeof COMMON_MESSAGE_KEYS)['ERROR'][keyof (typeof COMMON_MESSAGE_KEYS)['ERROR']];
export type CommonMessageKey = CommonErrorMessageKey;
