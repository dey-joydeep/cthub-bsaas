import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val);
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
          return { success: true, data: value } as const;
        }
        if (isPlainObject(value)) {
          const keys = Object.keys(value);

          // Treat empty object as empty data
          if (keys.length === 0) {
            return { success: true, data: {} } as const;
          }
        }
        return { success: true, data: value } as const;
      }),
    );
  }
}
