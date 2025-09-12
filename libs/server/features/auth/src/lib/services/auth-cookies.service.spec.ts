import { AuthCookiesService } from './auth-cookies.service';

describe('AuthCookiesService', () => {
  let service: AuthCookiesService;
  let registry: { set: jest.Mock; clear: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    registry = { set: jest.fn(), clear: jest.fn() } as unknown as typeof registry;
    config = { get: jest.fn(() => 'example.com') } as unknown as typeof config;
    service = new AuthCookiesService(registry as any, config as any);
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

  it('clear deletes both auth cookies with configured domain and paths', () => {
    service.clear();
    expect(registry.clear).toHaveBeenCalledWith('bsaas_rt', expect.objectContaining({ path: '/auth', domain: 'example.com' }));
    expect(registry.clear).toHaveBeenCalledWith('bsaas_at', expect.objectContaining({ path: '/', domain: 'example.com' }));
  });
});

