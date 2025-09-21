import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CookieRegistry, buildSetCookie } from './cookie-commands';

/**
 * @public
 * Interceptor that applies queued cookie commands to the underlying response
 * using the current HTTP adapter (Express or Fastify).
 */
@Injectable()
export class CookiesInterceptor implements NestInterceptor {
  constructor(private readonly registry: CookieRegistry, private readonly httpAdapterHost: HttpAdapterHost) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const res = http.getResponse();
        const adapter = this.httpAdapterHost.httpAdapter;
        const commands = this.registry.drain();
        if (!commands.length) return;

        const values = commands.map(buildSetCookie);
        if (typeof (res).append === 'function') {
          values.forEach((v) => (res).append('Set-Cookie', v));
        } else if (typeof (res).header === 'function') {
          (res).header('Set-Cookie', values);
        } else {
          (adapter as any).setHeader(res, 'Set-Cookie', values.length === 1 ? values[0] : values);
        }
      }),
    );
  }
}
