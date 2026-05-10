import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';

const makeCtx = (req: Partial<{ method: string; headers: Record<string, any>; cookies: Record<string, string> }>) => ({
  switchToHttp: () => ({ getRequest: () => req }),
  getHandler: () => ({}),
  getClass: () => ({}),
}) as any;

describe('CsrfGuard (core)', () => {
  it('allows safe methods', () => {
    const guard = new CsrfGuard(new Reflector());
    expect(guard.canActivate(makeCtx({ method: 'GET' }))).toBe(true);
    expect(guard.canActivate(makeCtx({ method: 'HEAD' }))).toBe(true);
    expect(guard.canActivate(makeCtx({ method: 'OPTIONS' }))).toBe(true);
  });

  it('accepts X-CSRF-Token header variant', () => {
    const guard = new CsrfGuard(new Reflector());
    const ok = guard.canActivate(
      makeCtx({ method: 'POST', headers: { 'X-CSRF-Token': 'abc' }, cookies: { 'XSRF-TOKEN': 'abc' } }),
    );
    expect(ok).toBe(true);
  });

  it('rejects mismatch', () => {
    const guard = new CsrfGuard(new Reflector());
    expect(() =>
      guard.canActivate(
        makeCtx({ method: 'POST', headers: { 'x-xsrf-token': 'a' }, cookies: { 'XSRF-TOKEN': 'b' } }),
      ),
    ).toThrow(ForbiddenException);
  });
});

