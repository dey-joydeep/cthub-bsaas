import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';

import { ErrorService, NormalizedError } from '../errors/error.service';
import { CorrelationId } from '../http/correlation-id.middleware';

/**
 * @public
 * Global NestJS exception filter that normalizes errors via ErrorService and shapes HTTP responses.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorService: ErrorService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env['NODE_ENV'] === 'production';

    const correlationId = CorrelationId.get();
    const normalized = this.errorService.handle(exception, {
      context: 'GlobalExceptionFilter',
      requestUrl: request.url,
      includeStack: !isProduction,
    });

    const body = this.buildCanonicalEnvelope(normalized, isProduction, correlationId);
    response.status(normalized.status).json(body);
  }

  /**
   * Canonical error envelope as per API HLD:
   * { success: false, code, message, details?, meta: { correlationId } }
   */
  private buildCanonicalEnvelope(
    normalized: NormalizedError,
    isProduction: boolean,
    correlationId?: string,
  ): {
    success: false;
    code: string;
    message: string;
    details?: unknown;
    meta?: { correlationId: string };
  } {
    const shouldMaskDetails = normalized.shouldMaskResponse;
    const base: {
      success: false;
      code: string;
      message: string;
      details?: unknown;
      meta?: { correlationId: string };
    } = {
      success: false as const,
      code: normalized.code,
      message:
        isProduction && shouldMaskDetails
          ? 'An internal server error occurred'
          : normalized.message,
    };

    if (!shouldMaskDetails && normalized.details) {
      base.details = normalized.details;
    }

    if (correlationId) {
      base.meta = { correlationId };
    }

    return base;
  }
}
