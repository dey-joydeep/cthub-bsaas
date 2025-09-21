import { parseRefreshCookie } from '../../../src/lib/utils/cookie.util';

describe('cookie.util', () => {
  it('extracts refresh token from cookie header strings', () => {
    const token = parseRefreshCookie('foo=bar; refreshToken=refresh-value; another=value');
    expect(token).toBe('refresh-value');
  });

  it('returns undefined when refresh token cookie is absent', () => {
    expect(parseRefreshCookie('foo=bar; something=else')).toBeUndefined();
    expect(parseRefreshCookie(undefined)).toBeUndefined();
  });
});
