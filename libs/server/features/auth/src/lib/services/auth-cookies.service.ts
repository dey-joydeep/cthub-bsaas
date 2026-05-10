import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieRegistry } from '@cthub-bsaas/server-core';

/**
 * @public
 * Encapsulates auth cookie issuance and clearing via CookieRegistry.
 */
@Injectable()
export class AuthCookiesService {
  constructor(private readonly registry: CookieRegistry, private readonly config: ConfigService) {}

  /** Issue CSRF and optionally access/refresh cookies */
  issue(params: { csrf: string; accessToken?: string; refreshToken?: string }): void {
    const domain = this.config.get<string>('AUTH_COOKIE_DOMAIN');
    // CSRF: non-HttpOnly, SameSite=Lax, Secure, path '/'
    this.registry.set('XSRF-TOKEN', params.csrf, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain,
    });

    if (params.accessToken) {
      this.registry.set('bsaas_at', params.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        domain,
      });
    }
    if (params.refreshToken) {
      this.registry.set('bsaas_rt', params.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/auth',
        domain,
      });
    }
  }

  /** Rotate cookies on refresh: same as issue() */
  rotateOnRefresh(params: { csrf: string; accessToken: string; refreshToken: string }): void {
    this.issue(params);
  }

  /** Clear auth cookies */
  clear(): void {
    const domain = this.config.get<string>('AUTH_COOKIE_DOMAIN');
    this.registry.clear('bsaas_rt', { path: '/auth', domain });
    this.registry.clear('bsaas_at', { path: '/', domain });
  }
}

