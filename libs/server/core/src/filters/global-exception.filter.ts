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

    const timestamp = new Date().toISOString();
    const body = this.buildResponseBody(normalized, request.url, timestamp, isProduction, correlationId);

    response.status(normalized.status).json(body);
  }

  private buildResponseBody(
    normalized: NormalizedError,
    path: string,
    timestamp: string,
    isProduction: boolean,
    correlationId?: string,
  ): Record<string, unknown> {
    const shouldMaskDetails = normalized.shouldMaskResponse;
    const body: Record<string, unknown> = {
      statusCode: normalized.status,
      message:
        isProduction && shouldMaskDetails
          ? 'An internal server error occurred'
          : normalized.message,
      code: normalized.code,
      timestamp,
      path,
    };

    if (correlationId) {
      body.correlationId = correlationId;
    }

    if (!shouldMaskDetails && normalized.details) {
      body.details = normalized.details;
    }

    if (!isProduction && normalized.stack) {
      body.stack = normalized.stack;
    }

    return body;
  }
}
