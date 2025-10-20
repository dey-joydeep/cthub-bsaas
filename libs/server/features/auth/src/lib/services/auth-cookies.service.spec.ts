import { AuthCookiesService } from './auth-cookies.service';
import type { CookieRegistry, ConfigService, AuthConfig, CookieOptions } from '@cthub-bsaas/server-core';

type CookieRegistryMock = jest.Mocked<Pick<CookieRegistry, 'set' | 'clear'>>;

const BASE_AUTH_CONFIG: AuthConfig = {
  jwtAccessSecret: 'access-secret',
  jwtRefreshSecret: 'refresh-secret',
  jwtEmailChangeSecret: 'email-change-secret',
  jwtVerifyEmailSecret: 'verify-secret',
  jwtExpiresIn: '1h',
  refreshTokenExpiresIn: '7d',
  cookieDomain: 'example.com',
};

const createConfig = (overrides: Partial<AuthConfig> = {}): ConfigService => ({
  auth: {
    ...BASE_AUTH_CONFIG,
    ...overrides,
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

  const getSetCall = (name: string): [string, string, CookieOptions] => {
    const calls = (registry.set as unknown as jest.Mock<[string, string, CookieOptions][]>).mock
      .calls as unknown as [string, string, CookieOptions][];
    const found = calls.find((c) => c[0] === name);
    if (!found) throw new Error(`No set() call for cookie '${name}'`);
    return found;
  };

  it('issues csrf + auth cookies when tokens provided', () => {
    service.issue({ csrf: 'csrf123', accessToken: 'AT', refreshToken: 'RT' });
    // CSRF
    expect(registry.set).toHaveBeenCalledWith('XSRF-TOKEN', 'csrf123', expect.objectContaining({ httpOnly: false, path: '/', domain: 'example.com' }));
    // Access Token
    expect(registry.set).toHaveBeenCalledWith('bsaas_at', 'AT', expect.objectContaining({ httpOnly: true, path: '/', domain: 'example.com' }));
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
    expect(registry.set).toHaveBeenCalledWith(
      'bsaas_rt',
      'R2',
      expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 }),
    );
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
    config = createConfig({ refreshTokenExpiresIn: '90' });
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
    ];
    for (const [val, expected] of cases) {
      (registry.set as unknown as jest.Mock).mockClear();
      config = createConfig({ refreshTokenExpiresIn: val });
      service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
      service.issue({ csrf: 'c', refreshToken: 'R' });
      const call = getSetCall('bsaas_rt');
      expect(call[2]).toEqual(expect.objectContaining({ maxAge: expected }));
    }
  });

  it('omits Max-Age when duration is invalid', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    config = createConfig({ refreshTokenExpiresIn: 'abc' as unknown as string });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'c', refreshToken: 'R' });
    const call = getSetCall('bsaas_rt');
    expect(call[2].maxAge).toBeUndefined();
  });

  it('omits Max-Age when unit is unknown', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    config = createConfig({ refreshTokenExpiresIn: '10x' as unknown as string });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'c', refreshToken: 'R' });
    const call = getSetCall('bsaas_rt');
    expect(call[2].maxAge).toBeUndefined();
  });

  it('omits Max-Age when refresh TTL is missing', () => {
    (registry.set as unknown as jest.Mock).mockClear();
    // Force missing value
    config = createConfig({ refreshTokenExpiresIn: undefined as unknown as string });
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config);
    service.issue({ csrf: 'c', refreshToken: 'R' });
    const call = getSetCall('bsaas_rt');
    expect(call[2].maxAge).toBeUndefined();
  });
});
