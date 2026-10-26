import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@cthub-bsaas/server-core';
import type {
  EmailPort,
  ICredentialTotpRepository,
  IEmailVerificationRepository,
  IPasswordResetRepository,
  IRefreshTokenRepository,
  ISessionRepository,
  ISocialAccountRepository,
  TotpPort,
  IUserRepository,
} from '@cthub-bsaas/server-contracts-auth';
import type { RateLimiter } from '@cthub-bsaas/server-infrastructure';
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
    const config = { auth: { jwtRefreshSecret: 'ref' } } as ConfigService;

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
    const unused = <T>(): T => ({}) as T;
    const rateLimiter: RateLimiter = {
      checkOrThrow: async (): Promise<void> => undefined,
    };
    const service = new AuthService(
      userRepo,
      sessionRepo,
      refreshRepo,
      unused<ISocialAccountRepository>(),
      unused<ICredentialTotpRepository>(),
      jwt as JwtService,
      config,
      unused<TotpPort>(),
      unused<EmailPort>(),
      unused<IEmailVerificationRepository>(),
      unused<IPasswordResetRepository>(),
      audit,
      undefined, // invitePort
      rateLimiter,
    );

    await expect(service.refreshToken('rt-reused')).rejects.toThrow(UnauthorizedException);
    expect(sessionRepo.delete).toHaveBeenCalledWith('s1');
    expect(refreshRepo.revoke).not.toHaveBeenCalled();
  });
});
