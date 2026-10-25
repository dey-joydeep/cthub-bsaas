import { parseRefreshCookie } from '../../../src/lib/utils/cookie.util';
import { resolveAccessSecret, resolveRefreshSecret } from '../../../src/lib/utils/jwt-secret.util';
import type { ConfigService, AuthConfig } from '@cthub-bsaas/server-core';

const buildConfig = (overrides: Partial<AuthConfig>): ConfigService =>
  ({
    auth: {
      jwtAccessSecret: '',
      jwtRefreshSecret: '',
      jwtEmailChangeSecret: 'email-change-test',
      jwtVerifyEmailSecret: 'verify-test',
      jwtExpiresIn: '15m',
      cookieDomain: undefined,
      ...overrides,
    },
  }) as unknown as ConfigService;

describe('cookie.util', () => {
  it('extracts refresh token from cookie header strings', () => {
    const token = parseRefreshCookie('foo=bar; refreshToken=refresh-value; another=value');
    expect(token).toBe('refresh-value');
  });

  it('returns undefined when refresh token cookie is absent', () => {
    expect(parseRefreshCookie('foo=bar; something=else')).toBeUndefined();
    expect(parseRefreshCookie(undefined)).toBeUndefined();
  });

  it('returns empty string when refresh token cookie has no value', () => {
    expect(parseRefreshCookie('refreshToken=')).toBe('');
    expect(parseRefreshCookie('refreshToken')).toBe('');
  });

  it('supports bsaas_rt cookie names and decodes encoded values', () => {
    const encoded = encodeURIComponent('refresh+value');
    expect(parseRefreshCookie(`bsaas_rt=${encoded}`)).toBe('refresh+value');
  });
});

describe('jwt-secret.util', () => {
  it('prefers trimmed access secret and falls back to refresh secret when missing', () => {
    const configWithBoth = buildConfig({ jwtAccessSecret: '  custom-access  ', jwtRefreshSecret: 'custom-refresh' });
    expect(resolveAccessSecret(configWithBoth)).toBe('custom-access');

    const configWithoutAccess = buildConfig({ jwtAccessSecret: '  ', jwtRefreshSecret: 'refresh-only' });
    expect(resolveAccessSecret(configWithoutAccess)).toBe('refresh-only');
  });

  it('returns default access secret when no configured secrets are present', () => {
    const config = buildConfig({ jwtAccessSecret: '', jwtRefreshSecret: '' });
    expect(resolveAccessSecret(config)).toBe('test-access-secret');
  });

  it('prefers trimmed refresh secret and falls back to access secret when missing', () => {
    const configWithBoth = buildConfig({ jwtAccessSecret: 'access-secret', jwtRefreshSecret: '  refresh-secret  ' });
    expect(resolveRefreshSecret(configWithBoth)).toBe('refresh-secret');

    const configWithoutRefresh = buildConfig({ jwtAccessSecret: 'access-only', jwtRefreshSecret: '   ' });
    expect(resolveRefreshSecret(configWithoutRefresh)).toBe('access-only');
  });

  it('returns default refresh secret when no configured secrets are present', () => {
    const config = buildConfig({ jwtAccessSecret: '', jwtRefreshSecret: '' });
    expect(resolveRefreshSecret(config)).toBe('test-refresh-secret');
  });
});
