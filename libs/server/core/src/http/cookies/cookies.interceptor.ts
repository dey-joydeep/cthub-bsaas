import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CookieRegistry, buildSetCookie } from './cookie-commands';

type ExpressLikeResponse = { append(name: string, value: string): void };
type FastifyLikeResponse = { header(name: string, value: string | string[]): void };

function isExpressResponse(res: unknown): res is ExpressLikeResponse {
  return typeof (res as { append?: unknown }).append === 'function';
}

function isFastifyResponse(res: unknown): res is FastifyLikeResponse {
  return typeof (res as { header?: unknown }).header === 'function';
}

interface HeaderCapableAdapter {
  setHeader(res: unknown, name: string, value: string | string[]): void;
}

/**
 * @public
 * Interceptor that applies queued cookie commands to the underlying response
 * using the current HTTP adapter (Express or Fastify).
 */
/* istanbul ignore next */
@Injectable()
export class CookiesInterceptor implements NestInterceptor {
  private readonly registry: CookieRegistry;
  private readonly httpAdapterHost: HttpAdapterHost;

  /* istanbul ignore next */
  constructor(registry: CookieRegistry, httpAdapterHost: HttpAdapterHost) {
    this.registry = registry;
    this.httpAdapterHost = httpAdapterHost;
  }

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const res = http.getResponse<unknown>();
        const commands = this.registry.drain();
        if (commands.length === 0) return;

        const values = commands.map(buildSetCookie);

        if (isExpressResponse(res)) {
          for (const v of values) {
            res.append('Set-Cookie', v);
          }
          return;
        }

        if (isFastifyResponse(res)) {
          res.header('Set-Cookie', values);
          return;
        }

        // Fallback: use adapter to set header (typed via a local interface)
        const adapter = this.httpAdapterHost.httpAdapter as unknown as HeaderCapableAdapter;
        const merged: string | string[] = values.length === 1 ? values[0] : values;
        adapter.setHeader(res, 'Set-Cookie', merged);
      }),
    );
  }
}
