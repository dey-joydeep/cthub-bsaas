import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@cthub-bsaas/server-core';
import {
  REFRESH_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
  SOCIAL_ACCOUNT_REPOSITORY,
  CREDENTIAL_TOTP_REPOSITORY,
  TOTP_PORT,
  EMAIL_PORT,
  EMAIL_VERIFICATION_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  INVITE_PORT,
  RATE_LIMITER,
  type IRefreshTokenRepository,
  type ISessionRepository,
  type IUserRepository,
} from '@cthub-bsaas/server-contracts-auth';
import type { RefreshToken } from '@prisma/client';
import { AuthService } from '../../../src/lib/services/auth.service';
import { AuditService } from '../../../src/lib/services/audit.service';

/**
 * Edge-case coverage: exercise the catch branch where session deletion fails
 * on revoked refresh token reuse. This is hard to simulate against a real DB,
 * so we use a lightweight Nest module with mocked repositories.
 */
describe('AuthService edge-case: revoked RT reuse deny_only path (IT harness)', () => {
  it('denies refresh and logs deny_only when session delete fails', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', jti: 'j1' }) } as unknown as JwtService;
    const config = { auth: { jwtRefreshSecret: 'ref' } } as unknown as ConfigService;

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

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: AuditService, useValue: audit },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshRepo },
        { provide: SESSION_REPOSITORY, useValue: sessionRepo },
        { provide: USER_REPOSITORY, useValue: userRepo },
        // Unused in this scenario, but required by constructor signature
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useValue: { findByProviderAccount: jest.fn(), link: jest.fn(), findByUserId: jest.fn(), unlink: jest.fn() } },
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: { findByUserId: jest.fn(), create: jest.fn(), delete: jest.fn() } },
        { provide: TOTP_PORT, useValue: { verifyToken: jest.fn() } },
        { provide: EMAIL_PORT, useValue: { sendMail: jest.fn() } },
        { provide: EMAIL_VERIFICATION_REPOSITORY, useValue: { findActiveByEmail: jest.fn(), create: jest.fn(), markUsed: jest.fn(), incrementAttempts: jest.fn() } },
        { provide: PASSWORD_RESET_REPOSITORY, useValue: { create: jest.fn(), findByToken: jest.fn(), markUsed: jest.fn() } },
        { provide: INVITE_PORT, useValue: { validateOwner: jest.fn(), completeOwner: jest.fn(), validateStaff: jest.fn(), completeStaff: jest.fn() } },
        { provide: RATE_LIMITER, useValue: { checkOrThrow: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    const service = moduleRef.get(AuthService);

    await expect(service.refreshToken('rt-reused')).rejects.toThrow(UnauthorizedException);
    expect(sessionRepo.delete).toHaveBeenCalledWith('s1');
    expect(refreshRepo.revoke).not.toHaveBeenCalled();
  });
});
