import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AUTH_ERROR_CODES } from '@cthub-bsaas/shared';
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
    findByEmail: jest.fn(async () => null),
    findById: jest.fn(async () => null),
    update: jest.fn(async () => ({} as unknown as User)),
  };
  const sessionRepo: Pick<ISessionRepository, 'create' | 'findById' | 'delete' | 'findByUserId'> = {
    create: jest.fn(async ({ userId }: { userId: string }) => ({ id: 'sess1', userId } as unknown as Session)),
    findById: jest.fn(async () => null),
    delete: jest.fn(async () => ({} as unknown as Session)),
    findByUserId: jest.fn(async () => ([] as unknown as Session[])),
  };
  const refreshRepo: Pick<IRefreshTokenRepository, 'create' | 'findByJti' | 'revoke'> = {
    create: jest.fn(async () => ({} as unknown as RefreshToken)),
    findByJti: jest.fn(async () => null),
    revoke: jest.fn(async () => ({} as unknown as RefreshToken)),
  };
  const credTotpRepo: Pick<ICredentialTotpRepository, 'findByUserId'> = { findByUserId: jest.fn(async () => null) };
  const jwt: Pick<JwtService, 'signAsync' | 'verifyAsync'> = {
    signAsync: jest.fn(async () => 'jwt'),
    verifyAsync: jest.fn(async () => ({} as unknown as Record<string, unknown>)) as unknown as JwtService['verifyAsync'],
  };
  const cfg: Pick<ConfigService, 'get'> = { get: jest.fn((k: string) => ((k.includes('REFRESH') ? 'rs' : 'as') as unknown as string)) };
  const totp: Pick<TotpPort, 'verifyToken'> = { verifyToken: jest.fn(async () => true) };
  const email: EmailPort = { sendMail: jest.fn(async () => {}) } as EmailPort;
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
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(service.signIn('x@example.com', 'p')).rejects.toBeTruthy();

    (userRepo.findByEmail as jest.Mock).mockResolvedValue({ ...user, passwordHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false as unknown as boolean);
    await expect(service.signIn(user.email, 'wrong')).rejects.toBeTruthy();
  });

  it('signIn totp challenge when verified', async () => {
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
    (credTotpRepo.findByUserId as jest.Mock).mockResolvedValue({ verified: true } as CredentialTOTP);
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
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
    (credTotpRepo.findByUserId as jest.Mock).mockResolvedValue(null);
    const res = await service.signIn(user.email, 'p');
    expect(res.totpRequired).toBe(false);
  });

  it('signInWithTotp success and failure branches', async () => {
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'totp' });
    (userRepo.findById as jest.Mock).mockResolvedValue(user);
    const ok = await service.signInWithTotp('t', '123456');
    expect(ok.accessToken).toBeDefined();
    // invalid aud
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'bad' });
    await expect(service.signInWithTotp('t', '123456')).rejects.toBeTruthy();
    // invalid totp code
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'totp' });
    (totp.verifyToken as jest.Mock).mockResolvedValue(false);
    await expect(service.signInWithTotp('t', '000000')).rejects.toBeTruthy();
    // user not found
    (totp.verifyToken as jest.Mock).mockResolvedValue(true);
    (userRepo.findById as jest.Mock).mockResolvedValue(null);
    await expect(service.signInWithTotp('t', '123456')).rejects.toBeTruthy();
  });

  it('refreshToken success and invalid', async () => {
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', jti: 'j1' });
    (refreshRepo.findByJti as jest.Mock).mockResolvedValue({ jti: 'j1', sessionId: 'sess1' } as RefreshToken);
    (userRepo.findById as jest.Mock).mockResolvedValue(user);
    const tokens = await service.refreshToken('rt');
    expect(tokens).toBeTruthy();
    expect(tokens!.accessToken).toBeDefined();
    (refreshRepo.findByJti as jest.Mock).mockResolvedValue(null);
    await expect(service.refreshToken('rt-bad')).rejects.toBeTruthy();
    // user not found branch
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'no-user', jti: 'j2' });
    (refreshRepo.findByJti as jest.Mock).mockResolvedValue({ jti: 'j2', sessionId: 'sess2' } as RefreshToken);
    (userRepo.findById as jest.Mock).mockResolvedValue(null);
    await expect(service.refreshToken('rt-no-user')).rejects.toBeTruthy();
  });

  it('logout branches and revokeSession', async () => {
    (sessionRepo.findById as jest.Mock).mockResolvedValue(null);
    await service.logout('sX');
    (sessionRepo.findById as jest.Mock).mockResolvedValue({ id: 's1', userId: 'u1' } as unknown as Session);
    await service.logout('s1');

    (sessionRepo.findById as jest.Mock).mockResolvedValue({ id: 's2', userId: 'u1' } as unknown as Session);
    await expect(service.revokeSession('u2', 's2')).rejects.toBeTruthy();
    await expect(service.revokeSession('u1', 's2')).resolves.toEqual({ success: true });
  });

  it('password reset (DB-backed) and email verification branches', async () => {
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
    await service.requestPasswordReset('none@example.com');

    (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
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
    (userRepo.findByEmail as jest.Mock).mockResolvedValue({ ...(user as User), emailVerifiedAt: new Date() } as unknown as User & { roles: { role: { name: string } }[] });
    await service.requestEmailVerification(user.email);
    (userRepo.findByEmail as jest.Mock).mockResolvedValue({ ...(user as User), emailVerifiedAt: null } as unknown as User & { roles: { role: { name: string } }[] });
    await service.requestEmailVerification(user.email);

    // verify email success and failure
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'verify' });
    await service.verifyEmail('tok');
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'bad' });
    await expect(service.verifyEmail('tok')).rejects.toBeTruthy();

    // invalid/expired branches via thrown verify
    (jwt.verifyAsync as jest.Mock).mockRejectedValue(new Error('bad'));
    await expect(service.resetPassword('tok', 'x')).rejects.toBeTruthy();
    await expect(service.verifyEmail('tok')).rejects.toBeTruthy();
  });

  it('issueTokensForUser covers not found branch', async () => {
    (userRepo.findById as jest.Mock).mockResolvedValue(null);
    await expect(service.issueTokensForUser('nope')).rejects.toBeTruthy();
  });

  it('issueTokensForUser success', async () => {
    const userWithRole = { ...(user as User), roles: [{ role: { name: 'admin' } }] } as unknown as User & { roles: { role: { name: string } }[] };
    (userRepo.findById as jest.Mock).mockResolvedValue(userWithRole);
    (sessionRepo.create as jest.Mock).mockResolvedValue({ id: 'sess2', userId: 'u1' } as unknown as Session);
    const tokens = await service.issueTokensForUser('u1');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('listSessions, resolveUserIdByEmail, and verifyEmailOtp branches', async () => {
    // listSessions
    const sessions = await service.listSessions('u1');
    expect(Array.isArray(sessions)).toBe(true);

    // resolveUserIdByEmail success and failure
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
    await expect(service.resolveUserIdByEmail('e@example.com')).resolves.toEqual('u1');
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(service.resolveUserIdByEmail('none@example.com')).rejects.toBeTruthy();

    // verifyEmailOtp success path
    const emailRepo = moduleRef.get(EMAIL_VERIFICATION_REPOSITORY) as IEmailVerificationRepository & { findActiveByEmail: jest.Mock };
    emailRepo.findActiveByEmail = jest.fn(async () => ({ id: 'rec1', codeHash: 'h', email: user.email, expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null, createdAt: new Date() } as EmailVerificationRecord));
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
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
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(service.verifyEmailOtp('nouser@example.com', '123456')).rejects.toBeTruthy();
  });

  it('covers config secret fallbacks for access/refresh', async () => {
    // Fallback to JWT_SECRET when JWT_ACCESS_SECRET is missing
    (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_SECRET' ? 'S' : undefined));
    (userRepo.findById as jest.Mock).mockResolvedValue(user);
    (sessionRepo.create as jest.Mock).mockResolvedValue({ id: 'sess3', userId: 'u1' } as unknown as Session);
    await service.issueTokensForUser('u1');

    // Default to test-access-secret when both missing
    (cfg.get as jest.Mock).mockImplementation(() => undefined);
    await service.issueTokensForUser('u1');

    // Refresh path fallback to JWT_SECRET then default
    (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_SECRET' ? 'S' : undefined));
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', jti: 'j3' });
    (refreshRepo.findByJti as jest.Mock).mockResolvedValue({ jti: 'j3', sessionId: 'sess3' } as RefreshToken);
    await service.refreshToken('rtS');

    (cfg.get as jest.Mock).mockImplementation(() => undefined);
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', jti: 'j4' });
    (refreshRepo.findByJti as jest.Mock).mockResolvedValue({ jti: 'j4', sessionId: 'sess4' } as RefreshToken);
    await service.refreshToken('rtD');
  });

  it('covers DB-backed reset success and verify token fallbacks', async () => {
    // requestPasswordReset -> DB-backed
    (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
    await service.requestPasswordReset(user.email);

    // reset success: create record and mock findById/compare
    const pr = moduleRef.get(PASSWORD_RESET_REPOSITORY) as IPasswordResetRepository;
    const rec = await pr.create({ id: 'rid6', userId: 'u1', tokenHash: await (bcrypt.hash as unknown as (s: string) => Promise<string>)('sec6'), expiresAt: new Date(Date.now() + 60000) });
    (pr.findById as unknown as jest.Mock) = jest.fn(async () => rec);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (sessionRepo.findByUserId as jest.Mock).mockResolvedValue([{ id: 's1', userId: 'u1' }] as unknown as Session[]);
    await service.resetPassword('rid6.sec6', 'new');

    // verifyEmail with explicit VERIFY secret (token path still supported)
    (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_VERIFY_EMAIL_SECRET' ? 'VS' : undefined));
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'verify' });
    await service.verifyEmail('tok');
    // verifyEmail fallback to ACCESS secret
    (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_ACCESS_SECRET' ? 'AS' : undefined));
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

  describe('Email Change', () => {
    const user = { id: 'u1', email: 'e@example.com', passwordHash: 'hash', roles: [] } as unknown as User & { roles: { role: { name: string } }[] };

    it('requestEmailChange success', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      await service.requestEmailChange(user.id, 'new@example.com');
      expect(audit.log).toHaveBeenCalledWith('email_change_requested', { userId: user.id });
    });

    it('requestEmailChange user not found', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.requestEmailChange('u2', 'new@example.com')).rejects.toThrow(
        new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND),
      );
    });

    it('requestEmailChange email already exists', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (userRepo.findByEmail as jest.Mock).mockResolvedValue({ id: 'u2', roles: [] } as unknown as User & { roles: { role: { name: string } }[] });
      await expect(service.requestEmailChange(user.id, 'new@example.com')).rejects.toThrow(
        new BadRequestException(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS),
      );
    });

    it('confirmEmailChange success', async () => {
      const token = 'valid-token';
      (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'email-change', email: 'new@example.com' });
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      await service.confirmEmailChange(token);
      expect(userRepo.update).toHaveBeenCalledWith(user.id, { email: 'new@example.com', emailVerifiedAt: expect.any(Date) });
      expect(audit.log).toHaveBeenCalledWith('email_change_success', { userId: user.id });
    });

    it('confirmEmailChange invalid token', async () => {
      const token = 'invalid-token';
      (jwt.verifyAsync as jest.Mock).mockRejectedValue(new Error('invalid token'));
      await expect(service.confirmEmailChange(token)).rejects.toThrow(new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_VERIFY_TOKEN));
    });

    it('confirmEmailChange invalid audience', async () => {
      const token = 'valid-token';
      (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'wrong-audience', email: 'new@example.com' });
      await expect(service.confirmEmailChange(token)).rejects.toThrow(new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_VERIFY_TOKEN));
    });

    it('confirmEmailChange user not found', async () => {
      const token = 'valid-token';
      (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'email-change', email: 'new@example.com' });
      (userRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.confirmEmailChange(token)).rejects.toThrow(new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_VERIFY_TOKEN));
    });

    it('requestEmailChange should use JWT_EMAIL_CHANGE_SECRET from config', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_EMAIL_CHANGE_SECRET' ? 'secret' : undefined));
      await service.requestEmailChange(user.id, 'new@example.com');
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: user.id, aud: 'email-change', email: 'new@example.com' },
        { secret: 'secret', expiresIn: '10m' },
      );
    });

    it('requestEmailChange should fallback to JWT_SECRET from config', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_SECRET' ? 'fallback-secret' : undefined));
      await service.requestEmailChange(user.id, 'new@example.com');
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: user.id, aud: 'email-change', email: 'new@example.com' },
        { secret: 'fallback-secret', expiresIn: '10m' },
      );
    });

    it('requestEmailChange should use default secret', async () => {
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (cfg.get as jest.Mock).mockImplementation(() => undefined);
      await service.requestEmailChange(user.id, 'new@example.com');
      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: user.id, aud: 'email-change', email: 'new@example.com' },
        { secret: 'test-email-change-secret', expiresIn: '10m' },
      );
    });

    it('confirmEmailChange should use JWT_EMAIL_CHANGE_SECRET from config', async () => {
      const token = 'valid-token';
      (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'email-change', email: 'new@example.com' });
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_EMAIL_CHANGE_SECRET' ? 'secret' : undefined));
      await service.confirmEmailChange(token);
      expect(jwt.verifyAsync).toHaveBeenCalledWith(token, { secret: 'secret' });
    });

    it('confirmEmailChange should fallback to JWT_SECRET from config', async () => {
      const token = 'valid-token';
      (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'email-change', email: 'new@example.com' });
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (cfg.get as jest.Mock).mockImplementation((k: string) => (k === 'JWT_SECRET' ? 'fallback-secret' : undefined));
      await service.confirmEmailChange(token);
      expect(jwt.verifyAsync).toHaveBeenCalledWith(token, { secret: 'fallback-secret' });
    });

    it('confirmEmailChange should use default secret', async () => {
      const token = 'valid-token';
      (jwt.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'u1', aud: 'email-change', email: 'new@example.com' });
      (userRepo.findById as jest.Mock).mockResolvedValue(user);
      (cfg.get as jest.Mock).mockImplementation(() => undefined);
      await service.confirmEmailChange(token);
      expect(jwt.verifyAsync).toHaveBeenCalledWith(token, { secret: 'test-email-change-secret' });
    });
  });
});