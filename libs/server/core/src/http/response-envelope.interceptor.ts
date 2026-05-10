import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        // Preserve Nest @Redirect return shape { url, statusCode }
        // const http = context.switchToHttp();
        if (isPlainObject(value)) {
          const v = value as Record<string, unknown>;
          const keys = Object.keys(v);
          if (keys.includes('url') && keys.includes('statusCode')) {
            return value;
          }
        }
        if (value === undefined || value === null) {
          return { success: true } as const;
        }
        if (isPlainObject(value)) {
          const keys = Object.keys(value);
          // If controller already returned canonical success-only, keep it
          if (keys.length === 1 && (value as Record<string, unknown>).success === true) {
            return value;
          }
          // Treat empty object as no data
          if (keys.length === 0) {
            return { success: true } as const;
          }
        }
        return { success: true, data: value } as const;
      }),
    );
  }
}
