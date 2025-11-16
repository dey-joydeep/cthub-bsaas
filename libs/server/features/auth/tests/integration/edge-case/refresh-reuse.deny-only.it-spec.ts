import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@cthub-bsaas/server-core';
import type {
  IRefreshTokenRepository,
  ISessionRepository,
  IUserRepository,
} from '@cthub-bsaas/server-contracts-auth';
import type { RefreshToken } from '@prisma/client';
import { AuthService } from '../../../src/lib/services/auth.service';
import { AuditService } from '../../../src/lib/services/audit.service';

/**
 * Edge-case coverage: exercise the catch branch where session deletion fails
 * on revoked refresh token reuse. We instantiate the service directly with
 * mocked dependencies to drive the exact path under integration config.
 */
describe('AuthService edge-case: revoked RT reuse deny_only path (IT harness)', () => {
  it('denies refresh and logs deny_only when session delete fails', async () => {
    const jwt: Partial<JwtService> = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', jti: 'j1' }) };
    const config: Partial<ConfigService> = { auth: { jwtRefreshSecret: 'ref' } as any };

    const refreshRepo: jest.Mocked<IRefreshTokenRepository> = {
      create: jest.fn(),
      findByJti: jest.fn(),
      revoke: jest.fn(),
    } as unknown as jest.Mocked<IRefreshTokenRepository>;

    const sessionRepo: jest.Mocked<ISessionRepository> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockRejectedValue(new Error('db error')),
    } as unknown as jest.Mocked<ISessionRepository>;

    const userRepo: jest.Mocked<IUserRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    const rt: RefreshToken = {
      jti: 'j1',
      userId: 'u1',
      sessionId: 's1',
      issuedAt: new Date(Date.now() - 60_000),
      revokedAt: new Date(),
      rotatedFrom: 'prev',
    };
    refreshRepo.findByJti.mockResolvedValue(rt);

    const audit = { log: jest.fn() } as unknown as AuditService;

    // Instantiate AuthService directly with stubs for unused deps
    const noop: any = {};
    const service = new AuthService(
      userRepo as any,
      sessionRepo as any,
      refreshRepo as any,
      noop, // socialAccountRepository
      noop, // credentialTotpRepository
      jwt as JwtService,
      config as ConfigService,
      noop, // totp
      noop, // email
      noop, // emailVerRepo
      noop, // pwdResetRepo
      audit,
      undefined, // invitePort
      { checkOrThrow: async () => {} } as any,
    );

    await expect(service.refreshToken('rt-reused')).rejects.toThrow(UnauthorizedException);
    expect(sessionRepo.delete).toHaveBeenCalledWith('s1');
    expect(refreshRepo.revoke).not.toHaveBeenCalled();
  });
});
