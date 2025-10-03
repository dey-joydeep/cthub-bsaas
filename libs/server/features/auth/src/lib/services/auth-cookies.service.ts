import { Injectable } from '@nestjs/common';
import { ConfigService } from '@cthub-bsaas/server-core';
import { CookieRegistry } from '@cthub-bsaas/server-core';

@Injectable()
export class AuthCookiesService {
  private readonly registry: CookieRegistry;
  private readonly config: ConfigService;

  constructor(registry: CookieRegistry, config: ConfigService) {
    this.registry = registry;
    this.config = config;
  }

  issue(params: { csrf: string; accessToken?: string; refreshToken?: string }): void {
    const domain = this.config.auth.cookieDomain;
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

  rotateOnRefresh(params: { csrf: string; accessToken: string; refreshToken: string }): void {
    this.issue(params);
  }

  clear(): void {
    const domain = this.config.auth.cookieDomain;
    this.registry.clear('bsaas_rt', { path: '/auth', domain });
    this.registry.clear('bsaas_at', { path: '/', domain });
  }
}