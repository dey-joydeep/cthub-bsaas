import { resolveAccessSecret, resolveRefreshSecret } from './jwt-secret.util';
import type { AuthConfig, ConfigService } from '@cthub-bsaas/server-core';

const BASE_AUTH_CONFIG: AuthConfig = {
  jwtAccessSecret: 'test-access-secret',
  jwtRefreshSecret: 'test-refresh-secret',
  jwtEmailChangeSecret: 'test-email-change-secret',
  jwtVerifyEmailSecret: 'test-verify-email-secret',
  jwtExpiresIn: '1h',
  refreshTokenExpiresIn: '7d',
  cookieDomain: 'example.com',
};

function createConfig(overrides: Partial<AuthConfig> = {}): ConfigService {
  return {
    auth: {
      ...BASE_AUTH_CONFIG,
      ...overrides,
    },
  } as unknown as ConfigService;
}

describe('jwt-secret.util', () => {
  it('resolveAccessSecret prefers the configured access secret', () => {
    const config = createConfig({ jwtAccessSecret: 'access-override' });
    expect(resolveAccessSecret(config)).toBe('access-override');
  });

  it('resolveAccessSecret falls back to the refresh secret when access secret missing', () => {
    const config = createConfig({ jwtAccessSecret: '', jwtRefreshSecret: 'refresh-fallback' });
    expect(resolveAccessSecret(config)).toBe('refresh-fallback');
  });

  it('resolveAccessSecret defaults when both configured secrets are blank', () => {
    const config = createConfig({ jwtAccessSecret: '', jwtRefreshSecret: '' });
    expect(resolveAccessSecret(config)).toBe('test-access-secret');
  });

  it('resolveRefreshSecret prefers the configured refresh secret', () => {
    const config = createConfig({ jwtRefreshSecret: 'refresh-override' });
    expect(resolveRefreshSecret(config)).toBe('refresh-override');
  });

  it('resolveRefreshSecret falls back to the access secret when refresh missing', () => {
    const config = createConfig({ jwtRefreshSecret: '', jwtAccessSecret: 'access-fallback' });
    expect(resolveRefreshSecret(config)).toBe('access-fallback');
  });

  it('resolveRefreshSecret defaults when both configured secrets are blank', () => {
    const config = createConfig({ jwtAccessSecret: '', jwtRefreshSecret: '' });
    expect(resolveRefreshSecret(config)).toBe('test-refresh-secret');
  });
});
