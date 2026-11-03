import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PLATFORM_UTILS_TOKEN, type PlatformUtils } from './platform-utils';
import { resolveSsrApiUrl, SSR_API_ORIGIN, ssrInterceptor } from './ssr-interceptor';

const serverPlatform: PlatformUtils = { isServer: true, isBrowser: false, windowRef: null, documentRef: null };
const browserPlatform: PlatformUtils = { isServer: false, isBrowser: true, windowRef: null, documentRef: null };

describe('worktree SSR API routing', () => {
  it('rewrites only local API paths to the configured worktree API', () => {
    expect(resolveSsrApiUrl('/api/auth/me?view=full', 'http://localhost:3010')).toBe('http://localhost:3010/api/auth/me?view=full');
    expect(resolveSsrApiUrl('/partner/businesses', 'http://localhost:3010')).toBe('http://localhost:3010/partner/businesses');
    expect(resolveSsrApiUrl('/assets/logo.svg', 'http://localhost:3010')).toBe('/assets/logo.svg');
    expect(resolveSsrApiUrl('https://example.com/api', 'http://localhost:3010')).toBe('https://example.com/api');
    expect(resolveSsrApiUrl('/api/auth/me', null)).toBe('/api/auth/me');
  });

  it('rejects a remote or credential-bearing origin', () => {
    expect(() => resolveSsrApiUrl('/api/status', 'https://example.com')).toThrow(/local HTTP origin/);
    expect(() => resolveSsrApiUrl('/api/status', 'http://user:pass@localhost:3010')).toThrow(/local HTTP origin/);
  });

  it('routes server requests while leaving browser requests on the same origin', () => {
    for (const [platform, expectedUrl] of [
      [serverPlatform, 'http://localhost:3010/api/status'],
      [browserPlatform, '/api/status'],
    ] as const) {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_UTILS_TOKEN, useValue: platform },
          { provide: SSR_API_ORIGIN, useValue: 'http://localhost:3010' },
        ],
      });
      let forwarded: HttpRequest<unknown> | undefined;
      TestBed.runInInjectionContext(() =>
        ssrInterceptor(new HttpRequest('GET', '/api/status'), (request) => {
          forwarded = request;
          return of(new HttpResponse({ status: 200 }));
        }).subscribe(),
      );
      expect(forwarded?.url).toBe(expectedUrl);
      TestBed.resetTestingModule();
    }
  });
});
