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

const createConfig = (overrides: Partial<AuthConfig> = {}): ConfigService =>
  ({
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
      tenantId: 'tenant-1',
      iat: 1,
      exp: 2,
    });
    expect(result).toEqual({
      id: 'uid-1',
      userId: 'uid-1',
      email: 'e@example.com',
      roles: ['customer'],
      sessionId: 'sess-1',
      tenantId: 'tenant-1',
      managedBranchIds: undefined,
      canManageBranches: false,
    });
  });

  it('validate populates canManageBranches for manager staff and owners', () => {
    const cfg = createConfig();
    const strat = new JwtStrategy(cfg);

    const staffResult = strat.validate({
      sub: 'uid-staff',
      email: 'staff@example.com',
      roles: ['staff'],
      sessionId: 'sess-2',
      tenantId: 'tenant-1',
      managedBranchIds: ['branch-1'],
      iat: 1,
      exp: 2,
    });
    expect(staffResult.canManageBranches).toBe(true);
    expect(staffResult.managedBranchIds).toEqual(['branch-1']);

    const ownerResult = strat.validate({
      sub: 'uid-owner',
      email: 'owner@example.com',
      roles: ['OWNER'],
      sessionId: 'sess-3',
      tenantId: 'tenant-1',
      iat: 1,
      exp: 2,
    });
    expect(ownerResult.canManageBranches).toBe(true);

    const explicitFalse = strat.validate({
      sub: 'uid-explicit-false',
      email: 'staff@example.com',
      roles: ['staff'],
      sessionId: 'sess-4',
      tenantId: 'tenant-1',
      canManageBranches: false,
      managedBranchIds: ['branch-1'],
      iat: 1,
      exp: 2,
    });
    expect(explicitFalse.canManageBranches).toBe(false);
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
