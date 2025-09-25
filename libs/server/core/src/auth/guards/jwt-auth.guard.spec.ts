import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { from, lastValueFrom, of } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from '@cthub-bsaas/shared';

// Define a mock interface for AuthGuard to provide type safety for handleRequest
interface MockAuthGuard {
  handleRequest(
    err: Error | null,
    user: AuthenticatedUser | null,
    info: unknown,
    context: ExecutionContext,
    status?: unknown
  ): AuthenticatedUser;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  type ParentCanActivate = (context: ExecutionContext) => boolean | Promise<boolean> | Observable<boolean>;
  let parentProto: Partial<{ canActivate: ParentCanActivate; handleRequest: MockAuthGuard['handleRequest'] }>; // prototype of the anonymous class returned by AuthGuard('jwt')

  const getParentGuard = () =>
    parentProto as {
      canActivate: ParentCanActivate;
      handleRequest: MockAuthGuard['handleRequest'];
    };

  const invokeHandleRequest = (
    err: Error | null,
    user: AuthenticatedUser | null,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ) => (guard as unknown as MockAuthGuard).handleRequest(err, user, info, context, status);

  // Mock ExecutionContext for simplicity
  const mockExecutionContext = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({}) }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [JwtAuthGuard, Reflector],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    // IMPORTANT: this is the real "super" we want to spy on
    parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype);
    // Sanity check in case Jest gets confused
    expect(typeof parentProto.canActivate).toBe('function');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      // DO NOT spy on child or parent here; we want the override to return true early
      const canActivate = guard.canActivate(mockExecutionContext);

      expect(canActivate).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should call and return super.canActivate for non-public routes (boolean)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Spy on the TRUE parent prototype so the override executes and calls super
      const superCanActivate = jest.spyOn(getParentGuard(), 'canActivate').mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(superCanActivate).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should call and return super.canActivate for non-public routes (Promise)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const superCanActivate = jest.spyOn(getParentGuard(), 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(superCanActivate).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should call and return super.canActivate for non-public routes (Observable)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const superCanActivate = jest.spyOn(getParentGuard(), 'canActivate').mockReturnValue(of(true));

      const result = guard.canActivate(mockExecutionContext);
      const finalResult = await lastValueFrom(from(result as unknown));

      expect(superCanActivate).toHaveBeenCalledWith(mockExecutionContext);
      expect(finalResult).toBe(true);
    });

    it('should call super.canActivate when metadata is missing (undefined)', async () => {
      // Simulate no @Public() metadata found (distinct from false)
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined as unknown);

      const superSpy = jest.spyOn(getParentGuard(), 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(superSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });
    // Note: handleRequest is on the parent AuthGuard class.
    describe('handleRequest', () => {
      it('should return the user when there is no error and a user is provided', () => {
        const user = { id: 'test-id', username: 'test-user' };
        const result = (guard as unknown as MockAuthGuard).handleRequest(null, user as AuthenticatedUser, null, mockExecutionContext);
        expect(result).toBe(user);
      });

      it('should re-throw the error when an error is provided', () => {
        const error = new Error('test-error');
        expect(() => (guard as unknown as MockAuthGuard).handleRequest(error, null, null, mockExecutionContext)).toThrow(error);
      });

      it('should throw an UnauthorizedException when there is no user and no error', () => {
        expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, null, mockExecutionContext)).toThrow(UnauthorizedException);
      });

      it('should throw an UnauthorizedException when there is info (e.g., TokenExpiredError)', () => {
        const info = new Error('test-info');
        expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException with TokenExpiredError branch', () => {
        const tokenExpired = { name: 'TokenExpiredError', message: 'jwt expired' } as unknown;
        expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, tokenExpired, mockExecutionContext)).toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when info is an array with TokenExpiredError (Passport array case)', () => {
        const tokenExpired = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' }) as unknown;
        const infoArray = [tokenExpired] as unknown;
        expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, infoArray, mockExecutionContext)).toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when info is a plain string (e.g., "jwt expired")', () => {
        const info = 'jwt expired' as unknown;
        expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
      });

      it('should rethrow UnauthorizedException err branch specifically (not wrap)', () => {
        const err = new UnauthorizedException('no auth');
        expect(() => (guard as unknown as MockAuthGuard).handleRequest(err as unknown as Error, null, null, mockExecutionContext)).toThrow(UnauthorizedException);
      });
    });

    it('should throw UnauthorizedException when info has only name="TokenExpiredError"', () => {
      const info = { name: 'TokenExpiredError' } as unknown;
      expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when info has only message="jwt expired"', () => {
      const info = { message: 'jwt expired' } as unknown;
      expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when info is JsonWebTokenError (invalid token)', () => {
      const info = { name: 'JsonWebTokenError', message: 'invalid token' } as unknown;
      expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when info is NotBeforeError (jwt not active)', () => {
      const info = { name: 'NotBeforeError', message: 'jwt not active' } as unknown;
      expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when info is an empty array', () => {
      const info = [] as unknown;
      expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
    });
    it('should throw UnauthorizedException for TokenExpiredError with only expiredAt', () => {
      const info = { name: 'TokenExpiredError', expiredAt: new Date() } as unknown;
      expect(() => (guard as unknown as MockAuthGuard).handleRequest(null, null, info, mockExecutionContext)).toThrow(UnauthorizedException);
    });
  });

  describe('handleRequest – exhaustive early shapes', () => {
    const ctx = {} as ExecutionContext;

    type Case = [label: string, err: unknown, user: unknown, info: unknown, expectThrow: boolean];

    const cases: Case[] = [
      ['err UnauthorizedException rethrows', new UnauthorizedException('x'), null, null, true],
      ['user present returns user', null, { id: 1 }, null, false],
      ['no err, no user, no info', null, null, null, true],
      ['info Error generic', null, null, new Error('generic'), true],
      ['info string', null, null, 'jwt expired', true],
      ['info token expired (name only)', null, null, { name: 'TokenExpiredError' }, true],
      ['info token expired (message only)', null, null, { message: 'jwt expired' }, true],
      ['info token expired (name+message)', null, null, { name: 'TokenExpiredError', message: 'jwt expired' }, true],
      ['info token expired (expiredAt only)', null, null, { name: 'TokenExpiredError', expiredAt: new Date() }, true],
      ['info JsonWebTokenError', null, null, { name: 'JsonWebTokenError', message: 'invalid token' }, true],
      ['info NotBeforeError', null, null, { name: 'NotBeforeError', message: 'jwt not active' }, true],
      ['info array empty', null, null, [], true],
      ['info array with tokenExpired', null, null, [Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' })], true],
    ];

    test.each(cases)('%s', (_label, err, user, info, expectThrow) => {
      if (expectThrow) {
        expect(() => (guard as any).handleRequest(err, user, info, ctx)).toThrow(UnauthorizedException);
      } else {
        expect((guard as any).handleRequest(err, user, info, ctx)).toBe(user);
      }
    });
  });
});
