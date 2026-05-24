import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CorrelationId } from './correlation-id.middleware';

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

function buildSuccessEnvelope<T>(data: T): { success: true; data: T; meta?: { correlationId: string } } {
  const correlationId = CorrelationId.get();
  const base: { success: true; data: T; meta?: { correlationId: string } } = {
    success: true,
    data,
  };

  if (correlationId) {
    base.meta = { correlationId };
  }

  return base;
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        // Preserve Nest @Redirect return shape { url, statusCode }
        // const http = context.switchToHttp();
        if (isPlainObject(value)) {
          const v = value;
          const keys = Object.keys(v);
          if (keys.includes('url') && keys.includes('statusCode')) {
            return value;
          }
        }
        if (value === undefined || value === null) {
          return buildSuccessEnvelope(value);
        }
        if (isPlainObject(value)) {
          const keys = Object.keys(value);

          // Treat empty object as empty data
          if (keys.length === 0) {
            return buildSuccessEnvelope({});
          }
        }
        return buildSuccessEnvelope(value);
      }),
    );
  }
}
