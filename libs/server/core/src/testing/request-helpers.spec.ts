import { buildCookieHeader, extractCookieValue, toSetCookieArray, withBearerAuth, withCookieHeader } from './request-helpers';

describe('request helpers', () => {
  it('normalizes set-cookie headers', () => {
    expect(toSetCookieArray(undefined)).toEqual([]);
    expect(toSetCookieArray('a=1; Path=/')).toEqual(['a=1; Path=/']);
    expect(toSetCookieArray(['a=1; Path=/', 'b=2; Path=/'])).toEqual(['a=1; Path=/', 'b=2; Path=/']);
  });

  it('extracts cookie values and builds Cookie headers', () => {
    const cookies = ['bsaas_at=access; Path=/; HttpOnly', 'XSRF-TOKEN=csrf; Path=/'];

    expect(extractCookieValue(cookies, 'bsaas_at')).toBe('access');
    expect(extractCookieValue(cookies, 'missing')).toBeUndefined();
    expect(buildCookieHeader(cookies)).toBe('bsaas_at=access; XSRF-TOKEN=csrf');
    expect(buildCookieHeader(cookies, { names: ['XSRF-TOKEN'] })).toBe('XSRF-TOKEN=csrf');
    expect(buildCookieHeader([''])).toBe('');
  });

  it('applies auth and cookie headers to request-like objects', () => {
    const headers: Record<string, string> = {};
    const request = {
      set(name: string, value: string) {
        headers[name] = value;
        return this;
      },
    };

    expect(withBearerAuth(request, 'token')).toBe(request);
    expect(withCookieHeader(request, ['bsaas_at=access; Path=/'])).toBe(request);
    expect(withCookieHeader(request, [])).toBe(request);
    expect(headers).toEqual({
      Authorization: 'Bearer token',
      Cookie: 'bsaas_at=access',
    });
  });
});
