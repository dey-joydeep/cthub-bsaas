import { JwtStrategy } from './jwt.strategy';
import type { AuthConfig, ConfigService } from '@cthub-bsaas/server-core';

const BASE_AUTH_CONFIG: AuthConfig = {
  jwtAccessSecret: 'secret',
  jwtRefreshSecret: 'refresh-secret',
  jwtEmailChangeSecret: 'email-change-secret',
  jwtVerifyEmailSecret: 'verify-secret',
  jwtExpiresIn: '1h',
  cookieDomain: 'example.com',
};

const createConfig = (overrides: Partial<AuthConfig> = {}): ConfigService => ({
  auth: {
    ...BASE_AUTH_CONFIG,
    ...overrides,
  },
}) as unknown as ConfigService;

describe('JwtStrategy', () => {
  it('validate maps payload to user context', () => {
    const cfg = createConfig();
    const strat = new JwtStrategy(cfg);
    const result = strat.validate({
      sub: 'uid-1',
      email: 'e@example.com',
      roles: ['customer'],
      sessionId: 'sess-1',
      iat: 1,
      exp: 2,
    });
    expect(result).toEqual({ userId: 'uid-1', email: 'e@example.com', roles: ['customer'], sessionId: 'sess-1' });
  });

  it('extracts token from bsaas_at cookie first', () => {
    const cfg = createConfig();
    const strat = new JwtStrategy(cfg);
    type Req = { cookies?: Record<string, string | undefined>; headers?: { authorization?: string } };
    const extractor = (strat as unknown as { _jwtFromRequest: (r: Req) => string | null | undefined })._jwtFromRequest;
    const req: Req = { cookies: { bsaas_at: 'cookie-token' }, headers: { authorization: 'Bearer header-token' } };
    const tok = extractor(req);
    expect(tok).toBe('cookie-token');
  });

  it('falls back to Authorization header when cookie missing', () => {
    const cfg = createConfig();
    const strat = new JwtStrategy(cfg);
    type Req = { cookies?: Record<string, string | undefined>; headers?: { authorization?: string } };
    const extractor = (strat as unknown as { _jwtFromRequest: (r: Req) => string | null | undefined })._jwtFromRequest;
    const req: Req = { cookies: {}, headers: { authorization: 'Bearer header-token' } };
    const tok = extractor(req);
    expect(tok).toBe('header-token');
  });

  it('returns null when neither cookie nor Authorization header present', () => {
    const cfg = createConfig();
    const strat = new JwtStrategy(cfg);
    type Req = { cookies?: Record<string, string | undefined>; headers?: { authorization?: string } };
    const extractor = (strat as unknown as { _jwtFromRequest: (r: Req) => string | null | undefined })._jwtFromRequest;
    const req: Req = { cookies: {}, headers: {} };
    expect(extractor(req)).toBeNull();
  });
});
