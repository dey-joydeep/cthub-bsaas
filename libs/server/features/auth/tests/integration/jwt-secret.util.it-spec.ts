import { resolveAccessSecret, resolveRefreshSecret } from '../../src/lib/utils/jwt-secret.util';
import type { ConfigService } from '@nestjs/config';

describe('jwt-secret.util (integration coverage)', () => {
  it('covers access and refresh secret resolution branches', () => {
    const cfg = ({ get: (k: string) => ({ JWT_ACCESS_SECRET: 'A', JWT_REFRESH_SECRET: 'R', JWT_SECRET: 'S' } as Record<string, string>)[k] } as unknown) as ConfigService;
    expect(resolveAccessSecret(cfg)).toBe('A');
    const cfg2 = ({ get: (k: string) => ({ JWT_SECRET: 'S' } as Record<string, string>)[k] } as unknown) as ConfigService;
    expect(resolveAccessSecret(cfg2)).toBe('S');
    const cfg3 = ({ get: (k: string) => { void k; return undefined; } } as unknown) as ConfigService;
    expect(resolveAccessSecret(cfg3)).toBe('test-access-secret');

    expect(resolveRefreshSecret(cfg)).toBe('R');
    expect(resolveRefreshSecret(cfg2)).toBe('S');
    expect(resolveRefreshSecret(cfg3)).toBe('test-refresh-secret');
  });
});
