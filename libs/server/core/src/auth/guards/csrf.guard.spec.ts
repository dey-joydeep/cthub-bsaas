import { ForbiddenException, ExecutionContext, HttpArgumentsHost } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard, SKIP_CSRF_KEY, SkipCsrf } from './csrf.guard';

interface MockRequest {
  method?: string;
  headers?: Record<string, string | undefined>;
  cookies?: Record<string, string>;
}

interface MockExecutionContext extends ExecutionContext {
  switchToHttp: () => HttpArgumentsHost & { getRequest: () => MockRequest };
}

const makeCtx = (req: Partial<MockRequest>): MockExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => req as MockRequest }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as MockExecutionContext;

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CsrfGuard(reflector);
  });

  // Test for safe methods
  test.each(['GET', 'HEAD', 'OPTIONS'])('should allow safe method: %s', (method) => {
    const context = makeCtx({ method });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should default to GET and allow if method is not present', () => {
    const context = makeCtx({});
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(guard.canActivate(context)).toBe(true);
  });

  // Test for CSRF skip decorator
  it('should bypass check if SkipCsrf decorator is present', () => {
    const context = makeCtx({ method: 'POST' });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true); // Simulate decorator presence
    expect(guard.canActivate(context)).toBe(true);
  });

  // Test for token validation logic
  describe('Token Validation', () => {
    const token = 'test-csrf-token';

    beforeEach(() => {
      // For all validation tests, assume the decorator is not present
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    });

    test.each([
      { headerName: 'x-xsrf-token', headerValue: token },
      { headerName: 'x-csrf-token', headerValue: token },
      { headerName: 'X-CSRF-Token', headerValue: token },
    ])('should allow POST when $headerName header matches cookie', ({ headerName, headerValue }) => {
      const context = makeCtx({
        method: 'POST',
        headers: { [headerName]: headerValue },
        cookies: { 'XSRF-TOKEN': token },
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if tokens mismatch', () => {
      const context = makeCtx({
        method: 'POST',
        headers: { 'x-xsrf-token': 'wrong-token' },
        cookies: { 'XSRF-TOKEN': token },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('error.security.csrf_failed');
    });

    it('should throw ForbiddenException if header is missing but cookie is present', () => {
      const context = makeCtx({
        method: 'POST',
        headers: {},
        cookies: { 'XSRF-TOKEN': token },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow POST if CSRF cookie is not present', () => {
      const context = makeCtx({
        method: 'POST',
        headers: { 'x-xsrf-token': token },
        cookies: {}, // No XSRF-TOKEN cookie
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow POST if cookies object is undefined', () => {
      const context = makeCtx({
        method: 'POST',
        headers: { 'x-xsrf-token': token },
        cookies: undefined, // cookies object does not exist
      });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if header is an empty string and cookie is not', () => {
      const context = makeCtx({
        method: 'POST',
        headers: { 'x-xsrf-token': '' },
        cookies: { 'XSRF-TOKEN': token },
      });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow request if both header and cookie are matching empty strings', () => {
      const context = makeCtx({
        method: 'POST',
        headers: { 'x-xsrf-token': '' },
        cookies: { 'XSRF-TOKEN': '' },
      });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('SkipCsrf Decorator Function', () => {
    it('should set the correct metadata', () => {
      @SkipCsrf()
      class TestClass {}

      const metadata = Reflect.getMetadata(SKIP_CSRF_KEY, TestClass) as boolean | undefined;
      expect(metadata).toBe(true);
    });
  });
});
