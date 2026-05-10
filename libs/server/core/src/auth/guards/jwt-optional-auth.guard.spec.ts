import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { JwtOptionalAuthGuard } from './jwt-optional-auth.guard';

describe('JwtOptionalAuthGuard', () => {
  let guard: JwtOptionalAuthGuard;
  const ctx = {} as ExecutionContext;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [JwtOptionalAuthGuard],
    }).compile();

    guard = moduleRef.get(JwtOptionalAuthGuard);
  });

  it('returns user when authentication succeeds', () => {
    const user = { id: 'user-1' } as AuthenticatedUser;
    const result = guard.handleRequest(null, user, null, ctx);
    expect(result).toBe(user);
  });

  it('returns undefined when credentials are missing', () => {
    const result = guard.handleRequest(null, null, { message: 'No auth token' }, ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined when info payload is nullish', () => {
    const result = guard.handleRequest(null, null, null, ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined for token expired info payloads', () => {
    const tokenExpired = { name: 'TokenExpiredError', message: 'jwt expired' };
    const result = guard.handleRequest(null, null, tokenExpired, ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined when passport supplies info array with errors', () => {
    const infoArray = [Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' })];
    const result = guard.handleRequest(null, null, infoArray, ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined when passport supplies an empty info array', () => {
    const result = guard.handleRequest(null, null, [], ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined when info is UnauthorizedException instance', () => {
    const result = guard.handleRequest(null, null, new UnauthorizedException('forbidden'), ctx);
    expect(result).toBeUndefined();
  });

  it('returns undefined when UnauthorizedException is raised', () => {
    const result = guard.handleRequest(new UnauthorizedException('no auth'), null, null, ctx);
    expect(result).toBeUndefined();
  });

  it('rethrows unexpected errors', () => {
    const unexpected = new Error('database unavailable');
    expect(() => guard.handleRequest(unexpected, null, null, ctx)).toThrow(unexpected);
  });
});
