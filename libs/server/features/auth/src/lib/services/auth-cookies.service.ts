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

  private parseDurationToSeconds(input: string | undefined): number | undefined {
    if (!input) return undefined;
    // Accept any single alpha unit and validate below; unknown units return undefined
    const m = String(input).trim().match(/^\s*(\d+)\s*([a-z])?\s*$/i);
    if (!m) return undefined;
    const value = parseInt(m[1], 10);
    const unit = (m[2] || 's').toLowerCase();
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return undefined;
    }
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
      const rtMaxAge = this.parseDurationToSeconds(this.config.auth.refreshTokenExpiresIn);
      this.registry.set('bsaas_rt', params.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/auth',
        domain,
        ...(typeof rtMaxAge === 'number' ? { maxAge: rtMaxAge } : {}),
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
