import { CookieRegistry, buildSetCookie } from './cookie-commands';

describe('CookieRegistry', () => {
  it('should queue and drain commands', () => {
    const registry = new CookieRegistry();
    registry.set('test', 'value');
    registry.clear('other');
    const commands = registry.drain();
    expect(commands).toHaveLength(2);
    expect(commands[0]).toEqual({ action: 'set', name: 'test', value: 'value', options: undefined });
    expect(commands[1]).toEqual({ action: 'clear', name: 'other', options: undefined });
    expect(registry.drain()).toHaveLength(0);
  });
});

describe('buildSetCookie', () => {
  it('builds a simple set command', () => {
    const header = buildSetCookie({ action: 'set', name: 'a', value: 'b' });
    expect(header).toBe('a=b');
  });

  it('builds a clear command', () => {
    const header = buildSetCookie({ action: 'clear', name: 'a' });
    expect(header).toContain('a=');
    expect(header).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    expect(header).toContain('Max-Age=0');
  });

  it('includes all options', () => {
    const expires = new Date();
    const header = buildSetCookie({
      action: 'set',
      name: 'a',
      value: 'b',
      options: {
        path: '/',
        domain: 'example.com',
        maxAge: 3600,
        expires,
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      },
    });
    expect(header).toEqual(
      `a=b; Path=/; Domain=example.com; Expires=${expires.toUTCString()}; Max-Age=3600; Secure; HttpOnly; SameSite=Lax`,
    );
  });

  it('handles sameSite=strict', () => {
    const header = buildSetCookie({ action: 'set', name: 'a', value: 'b', options: { sameSite: 'strict' } });
    expect(header).toContain('SameSite=Strict');
  });

  it('handles sameSite=none', () => {
    const header = buildSetCookie({ action: 'set', name: 'a', value: 'b', options: { sameSite: 'none' } });
    expect(header).toContain('SameSite=None');
  });

  it('floors maxAge', () => {
    const header = buildSetCookie({ action: 'set', name: 'a', value: 'b', options: { maxAge: 123.9 } });
    expect(header).toContain('Max-Age=123');
  });
});
