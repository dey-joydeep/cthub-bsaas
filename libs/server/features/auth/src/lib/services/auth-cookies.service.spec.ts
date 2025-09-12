import { AuthCookiesService } from './auth-cookies.service';
import type { CookieRegistry } from '@cthub-bsaas/server-core';
import type { ConfigService } from '@nestjs/config';

describe('AuthCookiesService', () => {
  let service: AuthCookiesService;
  let registry: jest.Mocked<Pick<CookieRegistry, 'set' | 'clear'>>;
  let config: Pick<ConfigService, 'get'>;

  beforeEach(() => {
    registry = { set: jest.fn(), clear: jest.fn() } as unknown as jest.Mocked<Pick<CookieRegistry, 'set' | 'clear'>>;
    config = { get: jest.fn(() => 'example.com') };
    service = new AuthCookiesService(registry as unknown as CookieRegistry, config as unknown as ConfigService);
  });

  it('issues csrf + auth cookies when tokens provided', () => {
    service.issue({ csrf: 'csrf123', accessToken: 'AT', refreshToken: 'RT' });
    // CSRF
    expect(registry.set).toHaveBeenCalledWith('XSRF-TOKEN', 'csrf123', expect.objectContaining({ httpOnly: false, path: '/', domain: 'example.com' }));
    // Access Token
    expect(registry.set).toHaveBeenCalledWith('bsaas_at', 'AT', expect.objectContaining({ httpOnly: true, path: '/', domain: 'example.com' }));
    // Refresh Token
    expect(registry.set).toHaveBeenCalledWith('bsaas_rt', 'RT', expect.objectContaining({ httpOnly: true, path: '/auth', domain: 'example.com' }));
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
    expect(registry.set).toHaveBeenCalledWith('bsaas_rt', 'R2', expect.any(Object));
  });

  it('issues when only accessToken provided', () => {
    registry.set.mockClear();
    service.issue({ csrf: 'c3', accessToken: 'A3' });
    const calls = (registry.set as unknown as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain('XSRF-TOKEN');
    expect(calls).toContain('bsaas_at');
    expect(calls).not.toContain('bsaas_rt');
  });

  it('issues when only refreshToken provided', () => {
    registry.set.mockClear();
    service.issue({ csrf: 'c4', refreshToken: 'R4' });
    const calls = (registry.set as unknown as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain('XSRF-TOKEN');
    expect(calls).not.toContain('bsaas_at');
    expect(calls).toContain('bsaas_rt');
  });

  it('clear deletes both auth cookies with configured domain and paths', () => {
    service.clear();
    expect(registry.clear).toHaveBeenCalledWith('bsaas_rt', expect.objectContaining({ path: '/auth', domain: 'example.com' }));
    expect(registry.clear).toHaveBeenCalledWith('bsaas_at', expect.objectContaining({ path: '/', domain: 'example.com' }));
  });
});

