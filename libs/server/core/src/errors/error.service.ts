import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';

import { AppError } from './app.error';
import { LoggerService } from '../logger/logger.service';
import { CorrelationId } from '../http/correlation-id.middleware';

const DEFAULT_HTTP_ERROR_CODES: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: COMMON_MESSAGE_KEYS.ERROR.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: COMMON_MESSAGE_KEYS.ERROR.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: COMMON_MESSAGE_KEYS.ERROR.FORBIDDEN_PERMISSION,
  [HttpStatus.NOT_FOUND]: COMMON_MESSAGE_KEYS.ERROR.NOT_FOUND,
  [HttpStatus.CONFLICT]: COMMON_MESSAGE_KEYS.ERROR.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: COMMON_MESSAGE_KEYS.ERROR.RATE_LIMITED,
};

function isMessageKey(value: string): boolean {
  return value.startsWith('error.') || value.includes('.error.') || value.includes('.validation.');
}

/**
 * @public
 * Normalized shape returned after handling an error.
 */
export interface NormalizedError {
  /** HTTP status associated with the error. */
  status: number;
  /** Stable error code suitable for clients. */
  code: string;
  /** Human readable message. */
  message: string;
  /** Optional structured details. */
  details?: Record<string, unknown>;
  /** Optional stack trace (only when explicitly requested). */
  stack?: string;
  /** Indicates whether the public response should mask the internal message. */
  shouldMaskResponse: boolean;
}

/**
 * @public
 * Options to influence error normalization and logging.
 */
export interface HandleErrorOptions {
  /** Caller specific context identifier. */
  context?: string;
  /** HTTP request URL (if available). */
  requestUrl?: string;
  /**
   * When true, the normalized payload includes the stack trace (intended for non-production).
   * Defaults to false.
   */
  includeStack?: boolean;
}

/**
 * @public
 * Centralized error service that normalizes exceptions and logs them via LoggerService.
 */
@Injectable()
export class ErrorService {
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    if (!logger) {
      throw new Error('LoggerService required');
    }
    this.logger = logger;
  }

  /**
   * Normalize and log an error.
   * @param {unknown} exception Unknown exception thrown within the application.
   * @param {HandleErrorOptions} [options] Caller specific options.
   * @returns {NormalizedError} Normalized error payload.
   */
  public handle(exception: unknown, options?: HandleErrorOptions | null): NormalizedError {
    const resolvedOptions = options ?? {};
    const includeStack = resolvedOptions.includeStack ?? false;
    const normalized = this.normalize(exception, includeStack);
    this.logException(exception, normalized, resolvedOptions);
    return normalized;
  }

  private normalize(exception: unknown, includeStack: boolean): NormalizedError {
    if (exception instanceof AppError) {
      return this.fromAppError(exception, includeStack);
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, includeStack);
    }

    if (exception instanceof Error) {
      return this.fromGenericError(exception, includeStack);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: COMMON_MESSAGE_KEYS.ERROR.UNKNOWN,
      message: 'An unknown error occurred',
      shouldMaskResponse: true,
    };
  }

  private fromAppError(error: AppError, includeStack: boolean): NormalizedError {
    return {
      status: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
      stack: includeStack ? error.stack : undefined,
      shouldMaskResponse: error.statusCode >= 500,
    };
  }

  private fromHttpException(exception: HttpException, includeStack: boolean): NormalizedError {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message = exception.message;
    let code = DEFAULT_HTTP_ERROR_CODES[status] ?? COMMON_MESSAGE_KEYS.ERROR.HTTP_EXCEPTION;
    let details: Record<string, unknown> | undefined;

    if (typeof response === 'string') {
      message = response;
      if (isMessageKey(response)) {
        code = response;
      }
    } else if (typeof response === 'object' && response !== null) {
      const body = response as Record<string, unknown>;
      const rawMessage = body['message'];

      if (typeof rawMessage === 'string') {
        message = rawMessage;
      } else if (Array.isArray(rawMessage)) {
        message = rawMessage.join(', ');
      }

      if (typeof body['code'] === 'string') {
        code = body['code'];
      }

      if (body['details'] && typeof body['details'] === 'object') {
        details = body['details'] as Record<string, unknown>;
      }
    }

    return {
      status,
      code,
      message,
      details,
      stack: includeStack ? exception.stack : undefined,
      shouldMaskResponse: status >= 500,
    };
  }

  private fromGenericError(error: Error, includeStack: boolean): NormalizedError {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: COMMON_MESSAGE_KEYS.ERROR.UNHANDLED,
      message: error.message || 'Unhandled error',
      stack: includeStack ? error.stack : undefined,
      shouldMaskResponse: true,
    };
  }

  private logException(exception: unknown, normalized: NormalizedError, options: HandleErrorOptions): void {
    const context = options.context ?? 'ErrorService';
    const payload = this.buildLogPayload(normalized, options);

    if (normalized.status >= 500) {
      const trace = exception instanceof Error ? (exception.stack ?? normalized.stack) : normalized.stack;
      this.logger.error(payload, trace ?? undefined, context);
      return;
    }

    this.logger.warn(payload, context);
  }

  private buildLogPayload(normalized: NormalizedError, options: HandleErrorOptions): string {
    const payload: Record<string, unknown> = {
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
    };

    if (options.requestUrl) {
      payload.requestUrl = options.requestUrl;
    }

    if (normalized.details) {
      payload.details = normalized.details;
    }

    const cid = CorrelationId.get();
    if (cid) {
      payload.correlationId = cid;
    }

    return JSON.stringify(payload);
  }
}
