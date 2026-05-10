import { Test } from '@nestjs/testing';
import { AuthService } from '../../../src/lib/services/auth.service';
import { AuditService } from '../../../src/lib/services/audit.service';
import {
  USER_REPOSITORY,
  SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  CREDENTIAL_TOTP_REPOSITORY,
  TOTP_PORT,
  EMAIL_PORT,
  EMAIL_VERIFICATION_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  SOCIAL_ACCOUNT_REPOSITORY,
  type IUserRepository,
  type ISessionRepository,
  type IRefreshTokenRepository,
  type ICredentialTotpRepository,
  type TotpPort,
  type EmailPort,
  type IEmailVerificationRepository,
  type IPasswordResetRepository,
  type EmailVerificationRecord,
  type PasswordResetRecord,
  type OAuthProfile,
} from '@cthub-bsaas/server-contracts-auth';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { User, Session, RefreshToken } from '@prisma/client';

describe('AuthService social branches (integration-light)', () => {
  let service: AuthService;
  let moduleRef: import('@nestjs/testing').TestingModule;

  // Minimal providers for AuthService
  const userRepo: Pick<IUserRepository, 'findByEmail' | 'findById' | 'update'> = {
    findByEmail: async () => null,
    findById: async () => null,
    update: async () => ({} as unknown as User),
  };
  const sessionRepo: Pick<ISessionRepository, 'create' | 'findById' | 'delete' | 'findByUserId'> = {
    create: async ({ userId }: { userId: string }) => ({ id: 'sessA', userId } as unknown as Session),
    findById: async () => null,
    delete: async () => ({} as unknown as Session),
    findByUserId: async () => ([] as unknown as Session[]),
  };
  const refreshRepo: Pick<IRefreshTokenRepository, 'create' | 'findByJti' | 'revoke'> = {
    create: async () => ({} as unknown as RefreshToken),
    findByJti: async () => null,
    revoke: async () => ({} as unknown as RefreshToken),
  };
  const credTotpRepo: Pick<ICredentialTotpRepository, 'findByUserId'> = { findByUserId: async () => null };
  const jwt: Pick<JwtService, 'signAsync' | 'verifyAsync'> = {
    signAsync: async () => 'jwt',
    verifyAsync: (async () => ({} as unknown as Record<string, unknown>)) as unknown as JwtService['verifyAsync'],
  };
  const cfg: Pick<ConfigService, 'get'> = { get: () => 'S' };
  const totp: Pick<TotpPort, 'verifyToken'> = { verifyToken: async () => true };
  const email: EmailPort = { sendMail: async () => {} } as EmailPort;
  const emailRepo: IEmailVerificationRepository = {
    upsertForEmail: async () => ({} as EmailVerificationRecord),
    findActiveByEmail: async () => null,
    markUsed: async () => {},
    incrementAttempts: async () => {},
  };
  const pwdResetRepo: IPasswordResetRepository = {
    create: async () => ({} as PasswordResetRecord),
    findById: async () => null,
    markUsed: async () => {},
  };

  const socialRepo = {
    findByProviderAccount: jest.fn<Promise<{ userId: string } | null>, [string, string]>(),
    link: jest.fn(async () => ({ id: 1, createdAt: new Date(), userId: 'uA', provider: 'google', providerUserId: 'pid' } as import('@prisma/client').SocialAccount)),
    findByUserId: jest.fn(async () => [] as import('@prisma/client').SocialAccount[]),
    unlink: jest.fn(async () => {}),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: SESSION_REPOSITORY, useValue: sessionRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshRepo },
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: credTotpRepo },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: cfg },
        { provide: TOTP_PORT, useValue: totp },
        { provide: EMAIL_PORT, useValue: email },
        { provide: EMAIL_VERIFICATION_REPOSITORY, useValue: emailRepo },
        { provide: PASSWORD_RESET_REPOSITORY, useValue: pwdResetRepo },
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useValue: socialRepo },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  const user: User & { roles: { role: { name: string } }[] } = {
    id: 'uA',
    email: 'user@example.com',
    name: 'U',
    passwordHash: 'h',
    phone: null,
    isVerified: true,
    isActive: true,
    avatarUrl: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    salonTenantId: null,
    emailVerifiedAt: new Date(),
    roles: [],
  } as unknown as User & { roles: { role: { name: string } }[] };

  it('signInWithSocial: existing link', async () => {
    socialRepo.findByProviderAccount.mockResolvedValue({ userId: user.id });
    // Force user lookup for token issuing
    userRepo.findById = async () => user;
    const tokens = await service.signInWithSocial({ provider: 'google', providerUserId: 'pid' } as OAuthProfile);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('signInWithSocial: does not auto-link by email; throws when not linked', async () => {
    socialRepo.findByProviderAccount.mockResolvedValue(null);
    userRepo.findByEmail = async () => user;
    await expect(
      service.signInWithSocial({ provider: 'google', providerUserId: 'pid2', email: user.email, emailVerified: true } as OAuthProfile),
    ).rejects.toBeTruthy();
    expect(socialRepo.link).not.toHaveBeenCalled();
  });

  it('signInWithSocial: throws when unlinked and no email match', async () => {
    socialRepo.findByProviderAccount.mockResolvedValue(null);
    userRepo.findByEmail = async () => null;
    await expect(service.signInWithSocial({ provider: 'github', providerUserId: 'x' } as OAuthProfile)).rejects.toBeTruthy();
  });

  it('unlinkSocialAccount: prevents unlinking last method', async () => {
    socialRepo.findByUserId.mockResolvedValue([]);
    userRepo.findById = async () => ({ ...(user as User), passwordHash: null } as unknown as User & { roles: { role: { name: string } }[] });
    await expect(service.unlinkSocialAccount('uA', 'google')).rejects.toBeTruthy();
  });

  it('unlinkSocialAccount: unlinks when alternate method exists', async () => {
    socialRepo.findByUserId.mockResolvedValue([{ id: 1, createdAt: new Date(), userId: 'uA', provider: 'google', providerUserId: 'pid' } as import('@prisma/client').SocialAccount]);
    userRepo.findById = async () => ({ ...(user as User), passwordHash: 'h' } as unknown as User & { roles: { role: { name: string } }[] });
    await expect(service.unlinkSocialAccount('uA', 'google')).resolves.toBeUndefined();
    expect(socialRepo.unlink).toHaveBeenCalledWith('uA', 'google');
  });

  it('linkSocialAccount: links and audits', async () => {
    await expect(service.linkSocialAccount('uA', 'google', 'pid3')).resolves.toBeUndefined();
    expect(socialRepo.link).toHaveBeenCalledWith('uA', 'google', 'pid3');
  });
});
