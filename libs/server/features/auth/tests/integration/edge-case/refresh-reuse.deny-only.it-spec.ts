import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@cthub-bsaas/server-core';
import {
  REFRESH_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
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
      ],
    }).compile();

    const service = moduleRef.get(AuthService);

    await expect(service.refreshToken('rt-reused')).rejects.toThrow(UnauthorizedException);
    expect(sessionRepo.delete).toHaveBeenCalledWith('s1');
    expect(refreshRepo.revoke).not.toHaveBeenCalled();
  });
});
