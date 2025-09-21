import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StrongAuthGuard } from './strong-auth.guard';
import { CREDENTIAL_TOTP_REPOSITORY, ICredentialTotpRepository, CREDENTIAL_PASSKEY_REPOSITORY, ICredentialPasskeyRepository } from '@cthub-bsaas/server-contracts-auth';

import { AuthenticatedUser } from '@cthub-bsaas/shared';

const makeCtx = (user?: Partial<AuthenticatedUser>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext);

describe('StrongAuthGuard', () => {
  let guard: StrongAuthGuard;
  let totpRepo: ICredentialTotpRepository;
  let passkeyRepo: ICredentialPasskeyRepository;

  const mockTotpRepo = {
    findByUserId: jest.fn(),
  };

  const mockPasskeyRepo = {
    hasAny: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrongAuthGuard,
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: mockTotpRepo },
        { provide: CREDENTIAL_PASSKEY_REPOSITORY, useValue: mockPasskeyRepo },
      ],
    }).compile();

    guard = module.get<StrongAuthGuard>(StrongAuthGuard);
    totpRepo = module.get<ICredentialTotpRepository>(CREDENTIAL_TOTP_REPOSITORY);
    passkeyRepo = module.get<ICredentialPasskeyRepository>(CREDENTIAL_PASSKEY_REPOSITORY);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return false for an unauthenticated user', async () => {
    await expect(guard.canActivate(makeCtx(undefined))).resolves.toBe(false);
  });

  it('should allow non-admin roles without strong auth', async () => {
    await expect(guard.canActivate(makeCtx({ userId: 'u1', roles: ['OWNER'] }))).resolves.toBe(true);
  });

  it('should allow a user with an empty roles array', async () => {
    await expect(guard.canActivate(makeCtx({ userId: 'u5', roles: [] }))).resolves.toBe(true);
  });

  it('should allow a non-admin user who has no roles property', async () => {
    const user = { userId: 'u6' }; // No 'roles' property
    await expect(guard.canActivate(makeCtx(user as any))).resolves.toBe(true);
  });

  describe('for Admin users', () => {
    const adminUser = { userId: 'admin1', roles: ['ADMIN'] };

    it('should allow admin with a verified TOTP', async () => {
      mockTotpRepo.findByUserId.mockResolvedValue({ verified: true });
      mockPasskeyRepo.hasAny.mockResolvedValue(false);
      await expect(guard.canActivate(makeCtx(adminUser))).resolves.toBe(true);
    });

    it('should allow admin with a passkey', async () => {
      mockTotpRepo.findByUserId.mockResolvedValue(null);
      mockPasskeyRepo.hasAny.mockResolvedValue(true);
      await expect(guard.canActivate(makeCtx(adminUser))).resolves.toBe(true);
    });

    it('should allow admin with both verified TOTP and a passkey', async () => {
        mockTotpRepo.findByUserId.mockResolvedValue({ verified: true });
        mockPasskeyRepo.hasAny.mockResolvedValue(true);
        await expect(guard.canActivate(makeCtx(adminUser))).resolves.toBe(true);
      });

    it('should reject admin with an unverified TOTP and no passkey', async () => {
      mockTotpRepo.findByUserId.mockResolvedValue({ verified: false });
      mockPasskeyRepo.hasAny.mockResolvedValue(false);
      await expect(guard.canActivate(makeCtx(adminUser))).rejects.toThrow(ForbiddenException);
    });

    it('should reject admin with no TOTP record and no passkey', async () => {
      mockTotpRepo.findByUserId.mockResolvedValue(null);
      mockPasskeyRepo.hasAny.mockResolvedValue(false);
      await expect(guard.canActivate(makeCtx(adminUser))).rejects.toThrow(ForbiddenException);
    });

    it('should reject admin with a TOTP record missing the verified property', async () => {
      mockTotpRepo.findByUserId.mockResolvedValue({}); // Missing 'verified' property
      mockPasskeyRepo.hasAny.mockResolvedValue(false);
      await expect(guard.canActivate(makeCtx(adminUser))).rejects.toThrow(ForbiddenException);
    });
  });
});