import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * CookiesInterceptor
 *
 * - Applies cookies/headers prepared in res.locals in a type-safe way.
 * - Avoids using Response.prototype.header (sticks to setHeader/append).
 * - Returns Observable<unknown> to avoid unsafe "any" returns.
 */
interface CookieLocals {
  /** Pre-formatted Set-Cookie strings, e.g., "name=value; Path=/; HttpOnly; SameSite=Lax" */
  cookiesToSet?: string[];
  /** Arbitrary headers to set on the HTTP response */
  headersToSet?: Record<string, string>;
}

// Response<ResBody = any, Locals extends Record<string, any> = Record<string, any>>
type ExpressResponse = Response<unknown, CookieLocals>;

@Injectable()
export class CookiesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const res = context.switchToHttp().getResponse<ExpressResponse>();

    return next.handle().pipe(
      tap(() => {
        // Apply cookies (if any)
        const cookies = res.locals.cookiesToSet;
        if (Array.isArray(cookies) && cookies.length > 0) {
          for (const c of cookies) {
            res.append('Set-Cookie', c);
          }
        }

        // Apply headers (if any)
        const headers = res.locals.headersToSet;
        if (headers && typeof headers === 'object') {
          for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
          }
        }
      }),
    );
  }
}
