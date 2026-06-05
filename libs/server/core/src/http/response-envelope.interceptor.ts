import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CorrelationId } from './correlation-id.middleware';

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

interface SuccessMeta {
  readonly correlationId?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly total?: number;
}

interface SuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: SuccessMeta;
}

function isPagedResult(value: Record<string, unknown>): value is { items: unknown[]; page: { limit: number } } {
  return Array.isArray(value['items']) && isPlainObject(value['page']) && typeof value['page']['limit'] === 'number';
}

function buildSuccessEnvelope<T>(data: T, meta: Omit<SuccessMeta, 'correlationId'> = {}): SuccessEnvelope<T> {
  const correlationId = CorrelationId.get();
  const responseMeta = { ...(correlationId ? { correlationId } : {}), ...meta };
  const base: SuccessEnvelope<T> = {
    success: true,
    data,
  };

  if (Object.keys(responseMeta).length > 0) {
    return { ...base, meta: responseMeta };
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

          if (isPagedResult(value)) {
            return buildSuccessEnvelope(
              { items: value.items },
              {
                page: 1,
                pageSize: value.page.limit,
                total: value.items.length,
              },
            );
          }
        }
        return buildSuccessEnvelope(value);
      }),
    );
  }
}
