import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { PLATFORM_UTILS_TOKEN, PlatformUtils } from './platform-utils';

export const SSR_API_ORIGIN = new InjectionToken<string | null>('SSR_API_ORIGIN', {
  providedIn: 'root',
  factory: () => null,
});

export function resolveSsrApiUrl(requestUrl: string, origin: string | null): string {
  if (!origin || !/^\/(?:api|partner)(?:\/|[?#]|$)/.test(requestUrl)) {
    return requestUrl;
  }

  const target = new URL(origin);
  if (
    target.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(target.hostname) ||
    !target.port ||
    target.username ||
    target.password ||
    target.pathname !== '/' ||
    target.search ||
    target.hash
  ) {
    throw new Error('SSR_API_ORIGIN must be a local HTTP origin with an explicit port.');
  }
  return new URL(requestUrl, target.origin).toString();
}

/**
 * Interceptor to handle server-side rendering of HTTP requests
 */
export const ssrInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const platformUtils = inject<PlatformUtils>(PLATFORM_UTILS_TOKEN);

  // Skip for non-browser environments
  if (platformUtils?.isServer) {
    // Clone the request and modify it for server-side rendering
    const serverReq = req.clone({
      url: resolveSsrApiUrl(req.url, inject(SSR_API_ORIGIN)),
      headers: req.headers.set('X-Requested-With', 'XMLHttpRequest').set('ngsw-bypass', 'true'), // Bypass service worker if used
    });

    return next(serverReq);
  }

  // For browser environment, pass through the request
  return next(req);
};
