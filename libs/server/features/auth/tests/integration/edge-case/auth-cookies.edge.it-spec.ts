import { CookieRegistry, buildSetCookie } from '@cthub-bsaas/server-core';
import type { ConfigService } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';

const makeConfig = (opts: { domain?: string; ttl?: string; isProd?: boolean }) => ({
  auth: {
    jwtAccessSecret: 'a',
    jwtRefreshSecret: 'b',
    jwtEmailChangeSecret: 'c',
    jwtVerifyEmailSecret: 'd',
    jwtExpiresIn: '1h',
    refreshTokenExpiresInDefault: opts.ttl ?? '7d',
    refreshTokenExpiresInCustomer: '180d',
    cookieDomain: opts.domain ?? 'example.com',
  },
  app: {
    port: 3000,
    nodeEnv: opts.isProd ? 'production' : 'development',
    isProduction: opts.isProd ?? true,
    isDevelopment: !(opts.isProd ?? true),
    isTest: false,
    bodyLimitJson: '10mb',
    bodyLimitUrlEncoded: '10mb',
  },
});

describe('AuthCookiesService integration edge cases', () => {
  it('includes Max-Age in RT cookie for 2m and 3h and 4d', () => {
    const registry = new CookieRegistry();
    const service = new AuthCookiesService(registry, makeConfig({ ttl: '2m' }) as unknown as ConfigService);
    service.issue({ csrf: 'x', refreshToken: 'R' });
    const rt = registry.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    const header = buildSetCookie(rt);
    expect(header).toContain('Max-Age=120');

    const registry2 = new CookieRegistry();
    const service2 = new AuthCookiesService(registry2, makeConfig({ ttl: '3h' }) as unknown as ConfigService);
    service2.issue({ csrf: 'x', refreshToken: 'R' });
    const rt2 = registry2.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    expect(buildSetCookie(rt2)).toContain('Max-Age=10800');

    const registry3 = new CookieRegistry();
    const service3 = new AuthCookiesService(registry3, makeConfig({ ttl: '4d' }) as unknown as ConfigService);
    service3.issue({ csrf: 'x', refreshToken: 'R' });
    const rt3 = registry3.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    expect(buildSetCookie(rt3)).toContain('Max-Age=345600');
  });

  it('omits Max-Age when TTL is invalid or missing', () => {
    const registry = new CookieRegistry();
    const service = new AuthCookiesService(registry, makeConfig({ ttl: 'abc' as unknown as string }) as unknown as ConfigService);
    service.issue({ csrf: 'x', refreshToken: 'R' });
    const rt = registry.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    const header = buildSetCookie(rt);
    expect(header).not.toContain('Max-Age=');

    // Unknown unit branch (digits + bad unit) should also omit Max-Age (hits switch default)
    const regX = new CookieRegistry();
    const svcX = new AuthCookiesService(regX, makeConfig({ ttl: '10x' as unknown as string }) as unknown as ConfigService);
    svcX.issue({ csrf: 'x', refreshToken: 'R' });
    const rtX = regX.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    expect(buildSetCookie(rtX)).not.toContain('Max-Age=');

    const registry2 = new CookieRegistry();
    const cfg2 = makeConfig({ ttl: '7d' });
    // Simulate missing TTL by deleting the field
    (cfg2 as { auth: { refreshTokenExpiresInDefault?: string } }).auth.refreshTokenExpiresInDefault = undefined;
    const service2 = new AuthCookiesService(registry2, cfg2 as unknown as ConfigService);
    service2.issue({ csrf: 'x', refreshToken: 'R' });
    const rt2 = registry2.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    expect(buildSetCookie(rt2)).not.toContain('Max-Age=');
  });

  it('supports seconds unit and implicit seconds', () => {
    const regS = new CookieRegistry();
    const svcS = new AuthCookiesService(regS, makeConfig({ ttl: '60s' }) as unknown as ConfigService);
    svcS.issue({ csrf: 'x', refreshToken: 'R' });
    const rtS = regS.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    expect(buildSetCookie(rtS)).toContain('Max-Age=60');

    const regN = new CookieRegistry();
    const svcN = new AuthCookiesService(regN, makeConfig({ ttl: '90' }) as unknown as ConfigService);
    svcN.issue({ csrf: 'x', refreshToken: 'R' });
    const rtN = regN.drain().filter((c) => c.action === 'set' && c.name === 'bsaas_rt')[0];
    expect(buildSetCookie(rtN)).toContain('Max-Age=90');
  });

  it('issues AT cookie branch independently when only accessToken is provided', () => {
    const reg = new CookieRegistry();
    const svc = new AuthCookiesService(reg, makeConfig({ ttl: '7d' }) as unknown as ConfigService);
    svc.issue({ csrf: 'x', accessToken: 'A' });
    const cmds = reg.drain();
    expect(cmds.find((c) => c.action === 'set' && c.name === 'bsaas_at')).toBeTruthy();
    expect(cmds.find((c) => c.action === 'set' && c.name === 'bsaas_rt')).toBeFalsy();
  });

  it('rotateOnRefresh issues both cookies with Max-Age from TTL', () => {
    const reg = new CookieRegistry();
    const svc = new AuthCookiesService(reg, makeConfig({ ttl: '1d' }) as unknown as ConfigService);
    svc.rotateOnRefresh({ csrf: 'csrf', accessToken: 'AT', refreshToken: 'RT' });
    const cmds = reg.drain();
    const xsrf = cmds.find((c) => c.action === 'set' && c.name === 'XSRF-TOKEN');
    const at = cmds.find((c) => c.action === 'set' && c.name === 'bsaas_at');
    const rt = cmds.find((c) => c.action === 'set' && c.name === 'bsaas_rt');
    expect(xsrf).toBeTruthy();
    expect(at).toBeTruthy();
    expect(rt).toBeTruthy();
    expect(buildSetCookie(rt!)).toContain('Max-Age=86400');
  });

  it('omits Secure flag when not in production', () => {
    const reg = new CookieRegistry();
    const svc = new AuthCookiesService(reg, makeConfig({ ttl: '7d', isProd: false }) as unknown as ConfigService);
    svc.issue({ csrf: 'csrf', refreshToken: 'RT' });
    const cmds = reg.drain();
    const rt = cmds.find((c) => c.action === 'set' && c.name === 'bsaas_rt');
    const header = buildSetCookie(rt!);
    expect(header).not.toContain('Secure');
  });

  it('clear enqueues clear commands with Expires in past and Max-Age=0', () => {
    const reg = new CookieRegistry();
    const svc = new AuthCookiesService(reg, makeConfig({ ttl: '7d' }) as unknown as ConfigService);
    svc.clear();
    const cmds = reg.drain();
    const rtClr = cmds.find((c) => c.action === 'clear' && c.name === 'bsaas_rt');
    const atClr = cmds.find((c) => c.action === 'clear' && c.name === 'bsaas_at');
    expect(rtClr).toBeTruthy();
    expect(atClr).toBeTruthy();
    expect(buildSetCookie(rtClr!)).toContain('Max-Age=0');
    expect(buildSetCookie(atClr!)).toContain('Max-Age=0');
  });
});
