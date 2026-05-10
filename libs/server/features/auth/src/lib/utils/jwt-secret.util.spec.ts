import { resolveAccessSecret, resolveRefreshSecret } from './jwt-secret.util';
import type { ConfigService } from '@nestjs/config';

describe('jwt-secret.util', () => {
  const cfg = (overrides: Record<string, string | undefined>): ConfigService => ({
    get: (key: string) => overrides[key],
  }) as unknown as ConfigService;

  it('resolveAccessSecret uses JWT_ACCESS_SECRET first', () => {
    const secret = resolveAccessSecret(cfg({ JWT_ACCESS_SECRET: 'a', JWT_SECRET: 'b' }));
    expect(secret).toBe('a');
  });

  it('resolveAccessSecret falls back to JWT_SECRET', () => {
    const secret = resolveAccessSecret(cfg({ JWT_ACCESS_SECRET: undefined, JWT_SECRET: 'b' }));
    expect(secret).toBe('b');
  });

  it('resolveAccessSecret defaults in tests when unset', () => {
    const secret = resolveAccessSecret(cfg({}));
    expect(secret).toBe('test-access-secret');
  });

  it('resolveRefreshSecret uses JWT_REFRESH_SECRET first', () => {
    const secret = resolveRefreshSecret(cfg({ JWT_REFRESH_SECRET: 'r', JWT_SECRET: 'b' }));
    expect(secret).toBe('r');
  });

  it('resolveRefreshSecret falls back to JWT_SECRET', () => {
    const secret = resolveRefreshSecret(cfg({ JWT_REFRESH_SECRET: undefined, JWT_SECRET: 'b' }));
    expect(secret).toBe('b');
  });

  it('resolveRefreshSecret defaults in tests when unset', () => {
    const secret = resolveRefreshSecret(cfg({}));
    expect(secret).toBe('test-refresh-secret');
  });
});
