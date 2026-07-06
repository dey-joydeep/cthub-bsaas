import { AuthCookiesService } from './auth-cookies.service';
import type { CookieRegistry, ConfigService, AuthConfig, CookieOptions } from '@cthub-bsaas/server-core';

type CookieRegistryMock = jest.Mocked<Pick<CookieRegistry, 'set' | 'clear'>>;

const BASE_AUTH_CONFIG: AuthConfig = {
  jwtAccessSecret: 'access-secret',
  jwtRefreshSecret: 'refresh-secret',
  jwtEmailChangeSecret: 'email-change-secret',
  jwtVerifyEmailSecret: 'verify-secret',
  jwtExpiresIn: '1h',
  refreshTokenExpiresInDefault: '7d',
  refreshTokenExpiresInCustomer: '180d',
  cookieDomain: 'example.com',
};

const createConfig = (overrides: Partial<AuthConfig> = {}, app: { isProduction?: boolean } = {}): ConfigService =>
  ({
    auth: {
      ...BASE_AUTH_CONFIG,
      ...overrides,
    },
    app: {
      port: 3000,
      nodeEnv: app.isProduction ? 'production' : 'development',
      isProduction: app.isProduction ?? true,
      isDevelopment: !(app.isProduction ?? true),
      isTest: false,
      bodyLimitJson: '10mb',
      bodyLimitUrlEncoded: '10mb',
    },
  }) as unknown as ConfigService;

describe('AuthCookiesService', () => {
  let service: AuthCookiesService;
  let registry: CookieRegistryMock;
  let config: ConfigService;

  beforeEach(() => {
    registry = { set: jest.fn(), clear: jest.fn() } as unknown as CookieRegistryMock;
    config = createConfig();
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
  });

  it('parseDurationToSeconds covers all units and invalid cases (direct)', () => {
    const direct = service as unknown as { parseDurationToSeconds: (s: unknown) => number | undefined };
    expect(direct.parseDurationToSeconds(undefined)).toBeUndefined();
    expect(direct.parseDurationToSeconds('15s')).toBe(15);
    expect(direct.parseDurationToSeconds('2m')).toBe(120);
    expect(direct.parseDurationToSeconds('1h')).toBe(3600);
    expect(direct.parseDurationToSeconds('1d')).toBe(86400);
    expect(direct.parseDurationToSeconds('oops')).toBeUndefined();
    expect(direct.parseDurationToSeconds('5x')).toBeUndefined();
  });

  const getSetCall = (name: string): [string, string, CookieOptions] => {
    const calls = (registry.set as unknown as jest.Mock<[string, string, CookieOptions][]>).mock.calls as unknown as [
      string,
      string,
      CookieOptions,
    ][];
    const found = calls.find((c) => c[0] === name);
    if (!found) throw new Error(`No set() call for cookie '${name}'`);
    return found;
  };

  it('issues csrf + auth cookies when tokens provided', () => {
    service.issue({ csrf: 'csrf123', accessToken: 'AT', refreshToken: 'RT' });
    // CSRF
    expect(registry.set).toHaveBeenCalledWith(
      'XSRF-TOKEN',
      'csrf123',
      expect.objectContaining({ httpOnly: false, path: '/', domain: 'example.com' }),
    );
    // Access Token
    expect(registry.set).toHaveBeenCalledWith(
      'bsaas_at',
      'AT',
      expect.objectContaining({ httpOnly: true, path: '/', domain: 'example.com' }),
    );
    // Refresh Token (includes Max-Age based on refreshTokenExpiresIn)
    expect(registry.set).toHaveBeenCalledWith(
      'bsaas_rt',
      'RT',
      expect.objectContaining({ httpOnly: true, path: '/auth', domain: 'example.com', maxAge: 7 * 24 * 60 * 60 }),
    );
  });

  it('issues only csrf when tokens omitted', () => {
    registry.set.mockClear();
    service.issue({ csrf: 'only' });
    expect(registry.set).toHaveBeenCalledTimes(1);
    expect(registry.set).toHaveBeenCalledWith('XSRF-TOKEN', 'only', expect.any(Object));
  });

  it('rotateOnRefresh delegates to issue()', () => {
    registry.set.mockClear();
    service.rotateOnRefresh({ csrf: 'c2', accessToken: 'A2', refreshToken: 'R2' });
    expect(registry.set).toHaveBeenCalledWith('XSRF-TOKEN', 'c2', expect.any(Object));
    expect(registry.set).toHaveBeenCalledWith('bsaas_at', 'A2', expect.any(Object));
    expect(registry.set).toHaveBeenCalledWith('bsaas_rt', 'R2', expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 }));
  });

  it('rotateOnRefresh respects customer TTL when isCustomer is true', () => {
    registry.set.mockClear();
    config = createConfig({ refreshTokenExpiresInDefault: '7d', refreshTokenExpiresInCustomer: '180d' });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.rotateOnRefresh({ csrf: 'c', accessToken: 'A', refreshToken: 'R' }, { isCustomer: true });
    const call = getSetCall('bsaas_rt');
    expect(call[2]).toEqual(expect.objectContaining({ maxAge: 180 * 24 * 60 * 60 }));
  });

  it('rotateOnRefresh uses default TTL when isCustomer is false', () => {
    registry.set.mockClear();
    config = createConfig({ refreshTokenExpiresInDefault: '2d', refreshTokenExpiresInCustomer: '180d' });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.rotateOnRefresh({ csrf: 'c', accessToken: 'A', refreshToken: 'R' }, { isCustomer: false });
    const call = getSetCall('bsaas_rt');
    expect(call[2]).toEqual(expect.objectContaining({ maxAge: 2 * 24 * 60 * 60 }));
  });

  it('issues when only accessToken provided', () => {
    registry.set.mockClear();
    service.issue({ csrf: 'c3', accessToken: 'A3' });
    const calls = ((registry.set as unknown as jest.Mock).mock.calls as [string, string, CookieOptions][]).map((c) => c[0]);
    expect(calls).toEqual(expect.arrayContaining(['XSRF-TOKEN', 'bsaas_at']));
    expect(calls).not.toEqual(expect.arrayContaining(['bsaas_rt']));
  });

  it('issues when only refreshToken provided', () => {
    registry.set.mockClear();
    service.issue({ csrf: 'c4', refreshToken: 'R4' });
    const calls = ((registry.set as unknown as jest.Mock).mock.calls as [string, string, CookieOptions][]).map((c) => c[0]);
    expect(calls).toEqual(expect.arrayContaining(['XSRF-TOKEN', 'bsaas_rt']));
    expect(calls).not.toEqual(expect.arrayContaining(['bsaas_at']));
  });

  it('clear deletes both auth cookies with configured domain and paths', () => {
    service.clear();
    expect(registry.clear).toHaveBeenCalledWith('bsaas_rt', expect.objectContaining({ path: '/auth', domain: 'example.com' }));
    expect(registry.clear).toHaveBeenCalledWith('bsaas_at', expect.objectContaining({ path: '/', domain: 'example.com' }));
  });

  it('sets RT Max-Age using seconds when no suffix', () => {
    config = createConfig({ refreshTokenExpiresInDefault: '90' });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'c', refreshToken: 'R' });
    const call = getSetCall('bsaas_rt');
    expect(call[2]).toEqual(expect.objectContaining({ maxAge: 90 }));
  });

  it('sets RT Max-Age for m/h/d suffixes', () => {
    const cases: Array<[string, number]> = [
      ['60s', 60],
      ['2m', 120],
      ['3h', 10800],
      ['4d', 345600],
      ['5H', 5 * 60 * 60],
      [' 12 d ', 12 * 24 * 60 * 60],
    ];
    for (const [val, expected] of cases) {
      (registry.set as unknown as jest.Mock).mockClear();
      config = createConfig({ refreshTokenExpiresInDefault: val });
      service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
      service.issue({ csrf: 'c', refreshToken: 'R' });
      const call = getSetCall('bsaas_rt');
      expect(call[2]).toEqual(expect.objectContaining({ maxAge: expected }));
    }
  });

  it('omits Max-Age when duration is invalid', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    config = createConfig({ refreshTokenExpiresInDefault: 'abc' as unknown as string });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'c', refreshToken: 'R' });
    const call = getSetCall('bsaas_rt');
    expect(call[2].maxAge).toBeUndefined();
  });

  it('omits Max-Age when unit is unknown', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    config = createConfig({ refreshTokenExpiresInDefault: '10x' as unknown as string });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'c', refreshToken: 'R' });
    const call = getSetCall('bsaas_rt');
    expect(call[2].maxAge).toBeUndefined();
  });

  it('omits Max-Age when refresh TTL is missing', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    // Force missing value
    config = createConfig({ refreshTokenExpiresInDefault: undefined as unknown as string });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'c', refreshToken: 'R' });
    const call = getSetCall('bsaas_rt');
    expect(call[2].maxAge).toBeUndefined();
  });

  it('uses customer TTL when actor.isCustomer is true', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    config = createConfig({ refreshTokenExpiresInDefault: '7d', refreshTokenExpiresInCustomer: '180d' });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'x', refreshToken: 'R', accessToken: 'A' }, { isCustomer: true });
    const call = getSetCall('bsaas_rt');
    expect(call[2]).toEqual(expect.objectContaining({ maxAge: 180 * 24 * 60 * 60 }));
  });

  it('falls back to default TTL when customer TTL is missing but isCustomer=true', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    config = createConfig({ refreshTokenExpiresInDefault: '3d', refreshTokenExpiresInCustomer: undefined });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'x', refreshToken: 'R' }, { isCustomer: true });
    const call = getSetCall('bsaas_rt');
    expect(call[2]).toEqual(expect.objectContaining({ maxAge: 3 * 24 * 60 * 60 }));
  });

  it('uses default TTL when actor.isCustomer is false', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    config = createConfig({ refreshTokenExpiresInDefault: '7d', refreshTokenExpiresInCustomer: '180d' });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'x', refreshToken: 'R', accessToken: 'A' }, { isCustomer: false });
    const call = getSetCall('bsaas_rt');
    expect(call[2]).toEqual(expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 }));
  });

  // Legacy fallback removed: no tests for refreshTokenExpiresIn

  it('sets Secure only in production', () => {
    const regDev = { set: jest.fn(), clear: jest.fn() } as unknown as CookieRegistry;
    const cfgDev = createConfig({}, { isProduction: false });
    const svcDev = new AuthCookiesService(regDev as unknown as CookieRegistry, cfgDev);
    svcDev.issue({ csrf: 'x', refreshToken: 'R', accessToken: 'A' });
    const devCalls = (regDev.set as unknown as jest.Mock).mock.calls as [string, string, CookieOptions][];
    devCalls.forEach(([, , opts]) => expect(opts.secure).toBe(false));

    const regProd = { set: jest.fn(), clear: jest.fn() } as unknown as CookieRegistry;
    const cfgProd = createConfig({}, { isProduction: true });
    const svcProd = new AuthCookiesService(regProd as unknown as CookieRegistry, cfgProd);
    svcProd.issue({ csrf: 'x', refreshToken: 'R', accessToken: 'A' });
    const prodCalls = (regProd.set as unknown as jest.Mock).mock.calls as [string, string, CookieOptions][];
    prodCalls.forEach(([, , opts]) => expect(opts.secure).toBe(true));
  });
});
