import { Test } from '@nestjs/testing';
import { AuthService } from '../../src/lib/services/auth.service';
import { AuditService } from '../../src/lib/services/audit.service';
import {
  USER_REPOSITORY,
  SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  CREDENTIAL_TOTP_REPOSITORY,
  TOTP_PORT,
  EMAIL_PORT,
  EMAIL_VERIFICATION_REPOSITORY,
} from '@cthub-bsaas/server-contracts-auth';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { IUserRepository, ISessionRepository, IRefreshTokenRepository, ICredentialTotpRepository, TotpPort, EmailPort, IEmailVerificationRepository, EmailVerificationRecord, IPasswordResetRepository, PasswordResetRecord } from '@cthub-bsaas/server-contracts-auth';
import { PASSWORD_RESET_REPOSITORY, SOCIAL_ACCOUNT_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import type { User, Session, RefreshToken, CredentialTOTP } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
jest.mock('bcryptjs', () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => 'hash'),
}));

describe('AuthService branches (integration-light)', () => {
  let service: AuthService;
  let moduleRef: import('@nestjs/testing').TestingModule;
  const userRepo: Pick<IUserRepository, 'findByEmail' | 'findById' | 'update'> = {
    findByEmail: async () => null,
    findById: async () => null,
    update: async () => ({} as unknown as User),
  };
  const sessionRepo: Pick<ISessionRepository, 'create' | 'findById' | 'delete' | 'findByUserId'> = {
    create: async ({ userId }: { userId: string }) => ({ id: 'sess1', userId } as unknown as Session),
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
  const cfg: Pick<ConfigService, 'get'> = { get: (k: string) => ((k.includes('REFRESH') ? 'rs' : 'as') as unknown as string) };
  const totp: Pick<TotpPort, 'verifyToken'> = { verifyToken: async () => true };
  const email: EmailPort = { sendMail: async () => {} } as EmailPort;
  const audit = { log: jest.fn() };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: SESSION_REPOSITORY, useValue: sessionRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshRepo },
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useValue: { findByProviderAccount: async () => null, link: async () => ({}), findByUserId: async () => [], unlink: async () => {} } },
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: credTotpRepo },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: cfg },
        { provide: TOTP_PORT, useValue: totp },
        { provide: EMAIL_PORT, useValue: email },
        { provide: EMAIL_VERIFICATION_REPOSITORY, useValue: { upsertForEmail: async () => ({}), findActiveByEmail: async () => null, markUsed: async () => {}, incrementAttempts: async () => {} } },
        { provide: PASSWORD_RESET_REPOSITORY, useValue: { create: async (d: { id: string; userId: string; tokenHash: string; expiresAt: Date }) => ({ ...d, usedAt: null, createdAt: new Date() } as PasswordResetRecord), findById: async () => null, markUsed: async () => {} } as IPasswordResetRepository },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  beforeEach(() => {
    // reset bcrypt mock call history
    (bcrypt.compare as unknown as jest.Mock).mockReset();
    (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(true);
  });

  const user = { id: 'u1', email: 'e@example.com', passwordHash: '$2a$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', roles: [] } as unknown as User & { roles: { role: { name: string } }[] };

  it('signIn invalid credentials and password', async () => {
    userRepo.findByEmail = async () => null;
    await expect(service.signIn('x@example.com', 'p')).rejects.toBeTruthy();

    userRepo.findByEmail = async () => ({ ...user, passwordHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false as unknown as boolean);
    await expect(service.signIn(user.email, 'wrong')).rejects.toBeTruthy();
  });

  it('signIn totp challenge when verified', async () => {
    userRepo.findByEmail = async () => user;
    credTotpRepo.findByUserId = async () => ({ verified: true } as CredentialTOTP);
    // Case 1: access secret present
    (cfg as unknown as { get: jest.Mock }).get = jest.fn((k: string) => (k === 'JWT_ACCESS_SECRET' ? 'AS' : undefined));
    let res = await service.signIn(user.email, 'p');
    expect(res.totpRequired).toBe(true);
    // Case 2: access missing, fallback to JWT_SECRET
    (cfg as unknown as { get: jest.Mock }).get = jest.fn((k: string) => (k === 'JWT_SECRET' ? 'S' : undefined));
    res = await service.signIn(user.email, 'p');
    expect(res.totpRequired).toBe(true);
    // Case 3: both missing, default secret
    (cfg as unknown as { get: jest.Mock }).get = jest.fn(() => undefined);
    res = await service.signIn(user.email, 'p');
    expect(res.totpRequired).toBe(true);
  });

  it('signIn success without totp', async () => {
    userRepo.findByEmail = async () => user;
    credTotpRepo.findByUserId = async () => null;
    const res = await service.signIn(user.email, 'p');
    expect(res.totpRequired).toBe(false);
  });

  it('signInWithTotp success and failure branches', async () => {
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', aud: 'totp' })) as JwtService['verifyAsync'];
    userRepo.findById = async () => user;
    const ok = await service.signInWithTotp('t', '123456');
    expect(ok.accessToken).toBeDefined();
    // invalid aud
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', aud: 'bad' })) as JwtService['verifyAsync'];
    await expect(service.signInWithTotp('t', '123456')).rejects.toBeTruthy();
    // invalid totp code
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', aud: 'totp' })) as JwtService['verifyAsync'];
    totp.verifyToken = async () => false;
    await expect(service.signInWithTotp('t', '000000')).rejects.toBeTruthy();
    // user not found
    totp.verifyToken = async () => true;
    userRepo.findById = async () => null;
    await expect(service.signInWithTotp('t', '123456')).rejects.toBeTruthy();
  });

  it('refreshToken success and invalid', async () => {
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', jti: 'j1' })) as JwtService['verifyAsync'];
    refreshRepo.findByJti = async () => ({ jti: 'j1', sessionId: 'sess1' } as RefreshToken);
    userRepo.findById = async () => user;
    const tokens = await service.refreshToken('rt');
    expect(tokens).toBeTruthy();
    expect(tokens!.accessToken).toBeDefined();
    refreshRepo.findByJti = async () => null;
    await expect(service.refreshToken('rt-bad')).rejects.toBeTruthy();
    // user not found branch
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'no-user', jti: 'j2' })) as JwtService['verifyAsync'];
    refreshRepo.findByJti = async () => ({ jti: 'j2', sessionId: 'sess2' } as RefreshToken);
    userRepo.findById = async () => null;
    await expect(service.refreshToken('rt-no-user')).rejects.toBeTruthy();
  });

  it('logout branches and revokeSession', async () => {
    sessionRepo.findById = async () => null;
    await service.logout('sX');
    sessionRepo.findById = async () => ({ id: 's1', userId: 'u1' } as unknown as Session);
    await service.logout('s1');

    sessionRepo.findById = async () => ({ id: 's2', userId: 'u1' } as unknown as Session);
    await expect(service.revokeSession('u2', 's2')).rejects.toBeTruthy();
    await expect(service.revokeSession('u1', 's2')).resolves.toEqual({ success: true });
  });

  it('password reset (DB-backed) and email verification branches', async () => {
    userRepo.findByEmail = async () => null;
    await service.requestPasswordReset('none@example.com');

    userRepo.findByEmail = async () => user;
    await service.requestPasswordReset(user.email);

    // reset success using DB-backed token
    const pr = moduleRef.get(PASSWORD_RESET_REPOSITORY) as IPasswordResetRepository;
    const rec = await pr.create({ id: 'rid', userId: 'u1', tokenHash: await (bcrypt.hash as unknown as (s: string) => Promise<string>)('sec'), expiresAt: new Date(Date.now() + 60000) });
    (pr.findById as unknown as jest.Mock) = jest.fn(async () => rec);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await service.resetPassword('rid.sec', 'NewP@ss');
    // reset invalid token
    (pr.findById as unknown as jest.Mock) = jest.fn(async () => null);
    await expect(service.resetPassword('bad', 'x')).rejects.toBeTruthy();

    // email verification request
    userRepo.findByEmail = async () => ({ ...(user as User), emailVerifiedAt: new Date() } as unknown as User & { roles: { role: { name: string } }[] });
    await service.requestEmailVerification(user.email);
    userRepo.findByEmail = async () => ({ ...(user as User), emailVerifiedAt: null } as unknown as User & { roles: { role: { name: string } }[] });
    await service.requestEmailVerification(user.email);

    // verify email success and failure
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', aud: 'verify' })) as JwtService['verifyAsync'];
    await service.verifyEmail('tok');
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', aud: 'bad' })) as JwtService['verifyAsync'];
    await expect(service.verifyEmail('tok')).rejects.toBeTruthy();

    // invalid/expired branches via thrown verify
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => { throw new Error('bad'); }) as JwtService['verifyAsync'];
    await expect(service.resetPassword('tok', 'x')).rejects.toBeTruthy();
    await expect(service.verifyEmail('tok')).rejects.toBeTruthy();
  });

  it('issueTokensForUser covers not found branch', async () => {
    userRepo.findById = async () => null;
    await expect(service.issueTokensForUser('nope')).rejects.toBeTruthy();
  });

  it('issueTokensForUser success', async () => {
    const userWithRole = { ...(user as User), roles: [{ role: { name: 'admin' } }] } as unknown as User & { roles: { role: { name: string } }[] };
    userRepo.findById = async () => userWithRole;
    sessionRepo.create = async ({ userId }: { userId: string }) => ({ id: 'sess2', userId } as unknown as Session);
    const tokens = await service.issueTokensForUser('u1');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('listSessions, resolveUserIdByEmail, and verifyEmailOtp branches', async () => {
    // listSessions
    const sessions = await service.listSessions('u1');
    expect(Array.isArray(sessions)).toBe(true);

    // resolveUserIdByEmail success and failure
    userRepo.findByEmail = async () => user;
    await expect(service.resolveUserIdByEmail('e@example.com')).resolves.toEqual('u1');
    userRepo.findByEmail = async () => null;
    await expect(service.resolveUserIdByEmail('none@example.com')).rejects.toBeTruthy();

    // verifyEmailOtp success path
    const emailRepo = moduleRef.get(EMAIL_VERIFICATION_REPOSITORY) as IEmailVerificationRepository & { findActiveByEmail: jest.Mock };
    emailRepo.findActiveByEmail = jest.fn(async () => ({ id: 'rec1', codeHash: 'h', email: user.email, expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null, createdAt: new Date() } as EmailVerificationRecord));
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    userRepo.findByEmail = async () => user;
    await expect(service.verifyEmailOtp(user.email, '123456')).resolves.toBeUndefined();

    // verifyEmailOtp expired/missing
    emailRepo.findActiveByEmail = jest.fn(async () => null);
    await expect(service.verifyEmailOtp(user.email, '123456')).rejects.toBeTruthy();

    // verifyEmailOtp invalid code
    emailRepo.findActiveByEmail = jest.fn(async () => ({ id: 'rec2', codeHash: 'h2', email: user.email, expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null, createdAt: new Date() } as EmailVerificationRecord));
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.verifyEmailOtp(user.email, 'bad')).rejects.toBeTruthy();

    // verifyEmailOtp user not found
    emailRepo.findActiveByEmail = jest.fn(async () => ({ id: 'rec3', codeHash: 'h3', email: 'nouser@example.com', expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null, createdAt: new Date() } as EmailVerificationRecord));
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    userRepo.findByEmail = async () => null;
    await expect(service.verifyEmailOtp('nouser@example.com', '123456')).rejects.toBeTruthy();
  });

  it('covers config secret fallbacks for access/refresh', async () => {
    // Fallback to JWT_SECRET when JWT_ACCESS_SECRET is missing
    (cfg as unknown as { get: jest.Mock }).get = jest.fn((k: string) => (k === 'JWT_SECRET' ? 'S' : undefined));
    userRepo.findById = async () => user;
    sessionRepo.create = async ({ userId }: { userId: string }) => ({ id: 'sess3', userId } as unknown as Session);
    await service.issueTokensForUser('u1');

    // Default to test-access-secret when both missing
    (cfg as unknown as { get: jest.Mock }).get = jest.fn(() => undefined);
    await service.issueTokensForUser('u1');

    // Refresh path fallback to JWT_SECRET then default
    (cfg as unknown as { get: jest.Mock }).get = jest.fn((k: string) => (k === 'JWT_SECRET' ? 'S' : undefined));
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', jti: 'j3' })) as JwtService['verifyAsync'];
    refreshRepo.findByJti = async () => ({ jti: 'j3', sessionId: 'sess3' } as RefreshToken);
    await service.refreshToken('rtS');

    (cfg as unknown as { get: jest.Mock }).get = jest.fn(() => undefined);
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', jti: 'j4' })) as JwtService['verifyAsync'];
    refreshRepo.findByJti = async () => ({ jti: 'j4', sessionId: 'sess4' } as RefreshToken);
    await service.refreshToken('rtD');
  });

  it('covers DB-backed reset success and verify token fallbacks', async () => {
    // requestPasswordReset -> DB-backed
    userRepo.findByEmail = async () => user;
    await service.requestPasswordReset(user.email);

    // reset success: create record and mock findById/compare
    const pr = moduleRef.get(PASSWORD_RESET_REPOSITORY) as IPasswordResetRepository;
    const rec = await pr.create({ id: 'rid6', userId: 'u1', tokenHash: await (bcrypt.hash as unknown as (s: string) => Promise<string>)('sec6'), expiresAt: new Date(Date.now() + 60000) });
    (pr.findById as unknown as jest.Mock) = jest.fn(async () => rec);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    sessionRepo.findByUserId = async () => ([{ id: 's1', userId: 'u1' }] as unknown as Session[]);
    await service.resetPassword('rid6.sec6', 'new');

    // verifyEmail with explicit VERIFY secret (token path still supported)
    (cfg as unknown as { get: jest.Mock }).get = jest.fn((k: string) => (k === 'JWT_VERIFY_EMAIL_SECRET' ? 'VS' : undefined));
    (jwt as { verifyAsync: JwtService['verifyAsync'] }).verifyAsync = (async () => ({ sub: 'u1', aud: 'verify' })) as JwtService['verifyAsync'];
    await service.verifyEmail('tok');
    // verifyEmail fallback to ACCESS secret
    (cfg as unknown as { get: jest.Mock }).get = jest.fn((k: string) => (k === 'JWT_ACCESS_SECRET' ? 'AS' : undefined));
    await service.verifyEmail('tok');
  });

  it('resetPassword invalid token and missing record throw', async () => {
    const pr = moduleRef.get(PASSWORD_RESET_REPOSITORY) as IPasswordResetRepository;
    // bad format
    await expect(service.resetPassword('bad', 'x')).rejects.toBeTruthy();
    // well-formed but missing
    (pr.findById as unknown as jest.Mock) = jest.fn(async () => null);
    await expect(service.resetPassword('id.only', 'x')).rejects.toBeTruthy();
  });

  it('resetPassword mismatched secret throws (DB-backed)', async () => {
    const pr = moduleRef.get(PASSWORD_RESET_REPOSITORY) as IPasswordResetRepository;
    const rec = await pr.create({ id: 'rid7', userId: 'u1', tokenHash: await (bcrypt.hash as unknown as (s: string) => Promise<string>)('sec7'), expiresAt: new Date(Date.now() + 60000) });
    (pr.findById as unknown as jest.Mock) = jest.fn(async () => rec);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.resetPassword('rid7.sec7', 'x')).rejects.toBeTruthy();
  });
});
