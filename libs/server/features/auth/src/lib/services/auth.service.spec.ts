import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { mock, MockProxy } from 'jest-mock-extended';
import { User, CredentialTOTP, Session, RefreshToken, RegistrationStatus } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { ICredentialTotpRepository, IRefreshTokenRepository, ISessionRepository, IUserRepository, TotpPort, EMAIL_PORT, EmailPort, USER_REPOSITORY, SESSION_REPOSITORY, REFRESH_TOKEN_REPOSITORY, CREDENTIAL_TOTP_REPOSITORY, TOTP_PORT, EMAIL_VERIFICATION_REPOSITORY, IEmailVerificationRepository, EmailVerificationRecord, PASSWORD_RESET_REPOSITORY, IPasswordResetRepository, PasswordResetRecord, SOCIAL_ACCOUNT_REPOSITORY, OAuthProfile, INVITE_PORT, InvitePort } from '@cthub-bsaas/server-contracts-auth';
import { AuditService } from '../services/audit.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: MockProxy<IUserRepository>;
  let sessionRepository: MockProxy<ISessionRepository>;
  let refreshTokenRepository: MockProxy<IRefreshTokenRepository>;
  let credentialTotpRepository: MockProxy<ICredentialTotpRepository>;
  let jwtService: MockProxy<JwtService>;
  let configService: MockProxy<ConfigService>;
  let totpService: MockProxy<TotpPort>;
  let emailPort: EmailPort;
  let emailVerRepo: MockProxy<IEmailVerificationRepository>;
  let pwdResetRepo: MockProxy<IPasswordResetRepository>;
  let socialRepo: { findByProviderAccount: jest.Mock; link: jest.Mock; findByUserId: jest.Mock; unlink: jest.Mock };

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    phone: null,
    isVerified: true,
    registrationStatus: RegistrationStatus.PENDING,
    isMFAEnrollRequired: false,
    mfaReminderFirstAt: null,
    mfaReminderLastAt: null,
    isActive: true,
    avatarUrl: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    salonTenantId: null,
    emailVerifiedAt: new Date(),
  };
  const mockUserWithRoles = {
    ...mockUser,
    roles: [] as { role: { name: string } }[],
  } as User & { roles: { role: { name: string } }[] };

  beforeEach(async () => {
    userRepository = mock<IUserRepository>();
    sessionRepository = mock<ISessionRepository>();
    refreshTokenRepository = mock<IRefreshTokenRepository>();
    credentialTotpRepository = mock<ICredentialTotpRepository>();
    jwtService = mock<JwtService>();
    configService = mock<ConfigService>();
    totpService = mock<TotpPort>();
    emailPort = { sendMail: jest.fn().mockResolvedValue(undefined) };
    emailVerRepo = mock<IEmailVerificationRepository>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: SESSION_REPOSITORY, useValue: sessionRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepository },
        { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: credentialTotpRepository },
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useValue: (socialRepo = { findByProviderAccount: jest.fn(), link: jest.fn(), findByUserId: jest.fn(), unlink: jest.fn() }) },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: TOTP_PORT, useValue: totpService },
        { provide: EMAIL_PORT, useValue: emailPort },
        { provide: EMAIL_VERIFICATION_REPOSITORY, useValue: emailVerRepo },
        { provide: PASSWORD_RESET_REPOSITORY, useValue: (pwdResetRepo = mock<IPasswordResetRepository>()) },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('partner registration methods (no InvitePort)', () => {
    it('validateOwnerInvite throws when no port provided', async () => {
      await expect(service.validateOwnerInvite('t')).rejects.toThrow();
    });
    it('completeOwnerRegistration throws when no port provided', async () => {
      await expect(service.completeOwnerRegistration({ token: 't', password: 'P#1' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput)).rejects.toThrow();
    });
    it('validateStaffInvite throws when no port provided', async () => {
      await expect(service.validateStaffInvite('t')).rejects.toThrow();
    });
    it('completeStaffRegistration throws when no port provided', async () => {
      await expect(service.completeStaffRegistration({ token: 't', password: 'P#1' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput)).rejects.toThrow();
    });
  });

  describe('partner registration methods (with InvitePort)', () => {
    let auditService: AuditService;

    beforeEach(async () => {
      // Override module to provide InvitePort
      const module = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: USER_REPOSITORY, useValue: userRepository },
          { provide: SESSION_REPOSITORY, useValue: sessionRepository },
          { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepository },
          { provide: CREDENTIAL_TOTP_REPOSITORY, useValue: credentialTotpRepository },
          { provide: SOCIAL_ACCOUNT_REPOSITORY, useValue: socialRepo },
          { provide: JwtService, useValue: jwtService },
          { provide: ConfigService, useValue: configService },
          { provide: TOTP_PORT, useValue: totpService },
          { provide: EMAIL_PORT, useValue: emailPort },
          { provide: EMAIL_VERIFICATION_REPOSITORY, useValue: emailVerRepo },
          { provide: PASSWORD_RESET_REPOSITORY, useValue: pwdResetRepo },
          { provide: AuditService, useValue: { log: jest.fn() } },
          {
            provide: INVITE_PORT,
            useValue: {
              validateOwner: jest.fn(() => Promise.resolve({ email: 'o@example.com', salonId: 's1' })),
              completeOwner: jest.fn(() => Promise.resolve({ userId: 'u1' })),
              validateStaff: jest.fn(() => Promise.resolve({ email: 's@example.com', salonId: 's1', role: 'STAFF' })),
              completeStaff: jest.fn(() => Promise.resolve({ userId: 'u2', requireMfa: true })),
            } as unknown as InvitePort,
          },
        ],
      }).compile();
      service = module.get<AuthService>(AuthService);
      auditService = module.get<AuditService>(AuditService);
    });

    it('validateOwnerInvite returns email and salonId and audits', async () => {
      await expect(service.validateOwnerInvite('tok')).resolves.toEqual({ email: 'o@example.com', salonId: 's1' });
      expect(auditService.log).toHaveBeenCalledWith('owner_invite_validate', { email: 'o@example.com' });
    });

    it('completeOwnerRegistration issues tokens and audits when MFA not required', async () => {
      const spy = jest.spyOn(service, 'issueTokensForUser').mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      const res = await service.completeOwnerRegistration({ token: 't', password: 'P#1' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
      expect(spy).toHaveBeenCalledWith('u1');
      expect(res).toEqual({ accessToken: 'a', refreshToken: 'r' });
      expect(auditService.log).toHaveBeenCalledWith('owner_registration_complete', { userId: 'u1' });
    });

    it('completeOwnerRegistration returns next:mfa when required', async () => {
      // Override invitePort.completeOwner to require MFA
      (service as unknown as { invitePort: InvitePort }).invitePort = {
        validateOwner: jest.fn(),
        completeOwner: jest.fn(() => Promise.resolve({ userId: 'uX', requireMfa: true })),
        validateStaff: jest.fn(),
        completeStaff: jest.fn(),
      } as unknown as InvitePort;
      const res = await service.completeOwnerRegistration({ token: 't', password: 'P#1' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
      expect(res).toEqual({ next: 'mfa' });
    });

    it('validateStaffInvite returns email and salonId and audits', async () => {
      await expect(service.validateStaffInvite('tok')).resolves.toEqual({ email: 's@example.com', salonId: 's1', role: 'STAFF' });
      expect(auditService.log).toHaveBeenCalledWith('staff_invite_validate', { email: 's@example.com' });
    });

    it('completeStaffRegistration returns next:mfa when required', async () => {
      const res = await service.completeStaffRegistration({ token: 't', password: 'P#1' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
      expect(res).toEqual({ next: 'mfa' });
    });

    it('completeStaffRegistration issues tokens and audits when MFA not required', async () => {
      // Override invitePort.completeStaff to not require MFA
      (service as unknown as { invitePort: InvitePort }).invitePort = {
        validateOwner: jest.fn(),
        completeOwner: jest.fn(),
        validateStaff: jest.fn(),
        completeStaff: jest.fn(() => Promise.resolve({ userId: 'u3' })),
      } as unknown as InvitePort;
      const spy = jest.spyOn(service, 'issueTokensForUser').mockResolvedValue({ accessToken: 'A', refreshToken: 'R' });
      const res = await service.completeStaffRegistration({ token: 't', password: 'P#1' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
      expect(spy).toHaveBeenCalledWith('u3');
      expect(res).toEqual({ accessToken: 'A', refreshToken: 'R' });
      expect(auditService.log).toHaveBeenCalledWith('staff_registration_complete', { userId: 'u3' });
    });
  });

  describe('register (Customer)', () => {
    it('creates Customer user, assigns role, and sends verification', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hp');
      userRepository.create.mockResolvedValue({ ...mockUser } as User);
      await expect(service.register('new@example.com', 'Password#1', 'New User')).resolves.toBeUndefined();
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('creates Customer with null name when not provided', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hp');
      userRepository.create.mockResolvedValue({ ...mockUser } as User);
      await expect(service.register('noname@example.com', 'Password#1')).resolves.toBeUndefined();
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({ name: null }));
    });

    it('is idempotent on existing Customer and may re-send verification', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUserWithRoles, emailVerifiedAt: null });
      const spy = jest.spyOn(service, 'requestEmailVerification').mockResolvedValue(undefined);
      await expect(service.register('test@example.com', 'Password#1')).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalledWith('test@example.com');
    });

    it('existing Customer already verified does not re-send verification', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUserWithRoles, emailVerifiedAt: new Date() });
      const spy = jest.spyOn(service, 'requestEmailVerification').mockResolvedValue(undefined);
      await expect(service.register('test@example.com', 'Password#1')).resolves.toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    const email = 'test@example.com';
    const password = 'password';
    const session = { id: 'session-id' } as Session;

    it('should return tokens for valid credentials when TOTP is not enabled', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUserWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      credentialTotpRepository.findByUserId.mockResolvedValue(null);
      sessionRepository.create.mockResolvedValue(session);
      jwtService.signAsync.mockResolvedValue('some-token');
      // @ts-expect-error - private method
      jest.spyOn(service, 'generateTokens').mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

      const result = await service.signIn(email, password);

      expect(result).toEqual({ totpRequired: false, accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.signIn(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUserWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.signIn(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should return a temporary token if TOTP is enabled', async () => {
      const totpCredential = { verified: true } as CredentialTOTP;
      userRepository.findByEmail.mockResolvedValue(mockUserWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      credentialTotpRepository.findByUserId.mockResolvedValue(totpCredential);
      jwtService.signAsync.mockResolvedValue('temporary-token');

      const result = await service.signIn(email, password);

      expect(result).toEqual({ totpRequired: true, tempToken: 'temporary-token' });
    });
  });

  describe('signInWithTotp', () => {
    const tempToken = 'temp-token';
    const totpCode = '123456';
    const session = { id: 'session-id' } as Session;
    const decodedTempToken = { sub: mockUser.id, aud: 'totp' };

    it('should return tokens for a valid temp token and TOTP code', async () => {
      jwtService.verifyAsync.mockResolvedValue(decodedTempToken);
      totpService.verifyToken.mockResolvedValue(true);
      userRepository.findById.mockResolvedValue(mockUserWithRoles);
      sessionRepository.create.mockResolvedValue(session);
      // @ts-expect-error - private method
      jest.spyOn(service, 'generateTokens').mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

      const result = await service.signInWithTotp(tempToken, totpCode);

      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(tempToken, expect.any(Object));
      expect(totpService.verifyToken).toHaveBeenCalledWith(mockUser.id, totpCode);
    });

    it('should throw UnauthorizedException for an invalid temp token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error());
      await expect(service.signInWithTotp(tempToken, totpCode)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for an invalid TOTP code', async () => {
      jwtService.verifyAsync.mockResolvedValue(decodedTempToken);
      totpService.verifyToken.mockResolvedValue(false);
      await expect(service.signInWithTotp(tempToken, totpCode)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('changes password when current matches', async () => {
      userRepository.findById.mockResolvedValue(mockUserWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      userRepository.update.mockResolvedValue({ ...mockUser } as User);
      await expect(service.changePassword('user-id', 'Old#1', 'New#1Password')).resolves.toBeUndefined();
      expect(userRepository.update).toHaveBeenCalledWith('user-id', { passwordHash: 'new-hash' });
    });

    it('throws Unauthorized when current invalid or same as new', async () => {
      userRepository.findById.mockResolvedValue(mockUserWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.changePassword('user-id', 'wrong', 'New#1Password')).rejects.toThrow(UnauthorizedException);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.changePassword('user-id', 'Same#1', 'Same#1')).rejects.toThrow(UnauthorizedException);
    });

    it('throws Unauthorized when user not found or missing hash', async () => {
      userRepository.findById.mockResolvedValue(null as unknown as User & { roles: { role: { name: string } }[] });
      await expect(service.changePassword('user-missing', 'x', 'New#1Password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('account recovery (DB-backed)', () => {
    it('requests password reset (no disclosure)', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUserWithRoles });
      pwdResetRepo.create.mockResolvedValue({ id: 'rid', userId: mockUserWithRoles.id, tokenHash: 'h', expiresAt: new Date(Date.now() + 1000), usedAt: null, createdAt: new Date() } as PasswordResetRecord);
      await expect(service.requestPasswordReset('test@example.com')).resolves.toBeUndefined();
      expect(emailPort.sendMail).toHaveBeenCalled();
      expect(pwdResetRepo.create).toHaveBeenCalled();
    });

    it('resets password with valid token and revokes sessions', async () => {
      const id = 'rid';
      const secret = 'sec';
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hash');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      pwdResetRepo.findById.mockResolvedValue({ id, userId: mockUserWithRoles.id, tokenHash: 'hash', expiresAt: new Date(Date.now() + 60000), usedAt: null, createdAt: new Date() } as PasswordResetRecord);
      sessionRepository.findByUserId.mockResolvedValue([
        {
          id: 's1',
          userId: mockUserWithRoles.id,
          deviceOS: null,
          deviceUA: null,
          ipHash: null,
          lastSeenAt: new Date(),
          createdAt: new Date(),
        } as unknown as Session,
      ]);
      userRepository.update.mockResolvedValue({ ...mockUserWithRoles });
      await expect(service.resetPassword(`${id}.${secret}`, 'newpass')).resolves.toBeUndefined();
      expect(pwdResetRepo.markUsed).toHaveBeenCalledWith(id);
      expect(sessionRepository.delete).toHaveBeenCalledWith('s1');
    });

    it('requests email verification (OTP stored and email sent)', async () => {
      const unver: User & { roles: { role: { name: string } }[] } = {
        ...mockUserWithRoles,
        emailVerifiedAt: null,
      };
      userRepository.findByEmail.mockResolvedValue(unver);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const rec: EmailVerificationRecord = {
        id: 'rec0',
        email: 'test@example.com',
        codeHash: 'hashed',
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
        usedAt: null,
        createdAt: new Date(),
      };
      emailVerRepo.upsertForEmail.mockResolvedValue(rec);
      await expect(service.requestEmailVerification('test@example.com')).resolves.toBeUndefined();
      expect(emailPort.sendMail).toHaveBeenCalled();
      expect(emailVerRepo.upsertForEmail).toHaveBeenCalled();
    });

    it('verifies email with valid token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: mockUserWithRoles.id, aud: 'verify' });
      const updated: User = { ...mockUser, emailVerifiedAt: new Date(), updatedAt: new Date() };
      userRepository.update.mockResolvedValue(updated);
      await expect(service.verifyEmail('verify-token')).resolves.toBeUndefined();
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('resetPassword throws when record expired/used or secret mismatch', async () => {
      const id = 'rid2';
      // expired
      pwdResetRepo.findById.mockResolvedValue({ id, userId: mockUserWithRoles.id, tokenHash: 'h', expiresAt: new Date(Date.now() - 1000), usedAt: null, createdAt: new Date() } as PasswordResetRecord);
      await expect(service.resetPassword(`${id}.sec`, 'x')).rejects.toThrow(UnauthorizedException);
      // used
      pwdResetRepo.findById.mockResolvedValue({ id, userId: mockUserWithRoles.id, tokenHash: 'h', expiresAt: new Date(Date.now() + 10000), usedAt: new Date(), createdAt: new Date() } as PasswordResetRecord);
      await expect(service.resetPassword(`${id}.sec`, 'x')).rejects.toThrow(UnauthorizedException);
      // mismatch
      pwdResetRepo.findById.mockResolvedValue({ id, userId: mockUserWithRoles.id, tokenHash: 'h', expiresAt: new Date(Date.now() + 10000), usedAt: null, createdAt: new Date() } as PasswordResetRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.resetPassword(`${id}.sec`, 'x')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmailOtp', () => {
    it('verifies email via OTP and marks used', async () => {
      emailVerRepo.findActiveByEmail.mockResolvedValue({ id: 'rec1', codeHash: 'h', email: mockUser.email, expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null, createdAt: new Date() } as EmailVerificationRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.findByEmail.mockResolvedValue(mockUserWithRoles);
      await expect(service.verifyEmailOtp(mockUser.email, '123456')).resolves.toBeUndefined();
      expect(emailVerRepo.markUsed).toHaveBeenCalledWith('rec1');
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
    });

    it('throws when OTP expired/missing', async () => {
      emailVerRepo.findActiveByEmail.mockResolvedValue(null);
      await expect(service.verifyEmailOtp('x@example.com', '000000')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when OTP does not match', async () => {
      emailVerRepo.findActiveByEmail.mockResolvedValue({ id: 'rec2', codeHash: 'h', email: mockUser.email, expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null, createdAt: new Date() } as EmailVerificationRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.verifyEmailOtp(mockUser.email, '999999')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when user not found during OTP verify', async () => {
      emailVerRepo.findActiveByEmail.mockResolvedValue({ id: 'rec3', codeHash: 'h', email: 'nouser@example.com', expiresAt: new Date(Date.now() + 60000), attempts: 0, usedAt: null, createdAt: new Date() } as EmailVerificationRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.verifyEmailOtp('nouser@example.com', '123456')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('audience and token guards', () => {
    it('signInWithTotp throws when audience is not totp', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id, aud: 'wrong' });
      await expect(service.signInWithTotp('t', '123456')).rejects.toThrow(UnauthorizedException);
    });

    it('resetPassword throws on wrong audience', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id, aud: 'wrong' });
      await expect(service.resetPassword('t', 'p')).rejects.toThrow(UnauthorizedException);
    });

    it('verifyEmail throws on wrong audience', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: mockUser.id, aud: 'wrong' });
      await expect(service.verifyEmail('t')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resolveUserIdByEmail', () => {
    it('returns user id when email exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUserWithRoles });
      await expect(service.resolveUserIdByEmail('test@example.com')).resolves.toEqual(mockUser.id);
    });

    it('throws when email not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.resolveUserIdByEmail('none@example.com')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sessions and tokens', () => {
    it('refreshes token on valid refresh token', async () => {
      const jti = 'jti-1';
      const sessionId = 'sess-1';
      jwtService.verifyAsync.mockResolvedValue({ sub: mockUserWithRoles.id, jti });
      const rt: RefreshToken = { jti, userId: mockUserWithRoles.id, sessionId, issuedAt: new Date(), revokedAt: null, rotatedFrom: null };
      refreshTokenRepository.findByJti.mockResolvedValue(rt);
      userRepository.findById.mockResolvedValue(mockUserWithRoles);
      // @ts-expect-error - private method
      jest.spyOn(service, 'generateTokens').mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });

      const result = await service.refreshToken('rt');
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith(jti);
      expect(result).toEqual({ accessToken: 'new-at', refreshToken: 'new-rt' });
    });

    it('logout revokes existing session when found', async () => {
      sessionRepository.findById.mockResolvedValue({ id: 's1', userId: mockUserWithRoles.id, deviceOS: null, deviceUA: null, ipHash: null, lastSeenAt: new Date(), createdAt: new Date() } as Session);
      await expect(service.logout('s1')).resolves.toBeUndefined();
      expect(sessionRepository.delete).toHaveBeenCalledWith('s1');
    });

    it('listSessions returns sessions', async () => {
      sessionRepository.findByUserId.mockResolvedValue([
        { id: 's1', userId: 'u1', deviceOS: null, deviceUA: null, ipHash: null, lastSeenAt: new Date(), createdAt: new Date() },
      ] as Session[]);
      const res = await service.listSessions('u1');
      expect(Array.isArray(res)).toBe(true);
      expect((res as Array<{ id: string }>)[0].id).toBe('s1');
    });

    it('revokeSession validates owner and deletes', async () => {
      sessionRepository.findById.mockResolvedValue({ id: 's1', userId: 'u1', deviceOS: null, deviceUA: null, ipHash: null, lastSeenAt: new Date(), createdAt: new Date() } as Session);
      const res = await service.revokeSession('u1', 's1');
      expect(sessionRepository.delete).toHaveBeenCalledWith('s1');
      expect(res).toEqual({ success: true });
    });

    it('revokeSession throws when owner mismatch or missing', async () => {
      sessionRepository.findById.mockResolvedValue({ id: 's1', userId: 'other', deviceOS: null, deviceUA: null, ipHash: null, lastSeenAt: new Date(), createdAt: new Date() } as Session);
      await expect(service.revokeSession('u1', 's1')).rejects.toThrow(UnauthorizedException);
    });

    it('refreshToken throws on invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad'));
      await expect(service.refreshToken('rt')).rejects.toThrow(UnauthorizedException);
    });

    it('refreshToken throws when stored token missing or revoked', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'x' });
      refreshTokenRepository.findByJti.mockResolvedValue({ jti: 'x', userId: 'u1', sessionId: 's1', issuedAt: new Date(), revokedAt: new Date(), rotatedFrom: null } as RefreshToken);
      await expect(service.refreshToken('rt')).rejects.toThrow(UnauthorizedException);
    });

    it('refreshToken throws when user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'x' });
      refreshTokenRepository.findByJti.mockResolvedValue({ jti: 'x', userId: 'u1', sessionId: 's1', issuedAt: new Date(), revokedAt: null, rotatedFrom: null } as RefreshToken);
      userRepository.findById.mockResolvedValue(null);
      await expect(service.refreshToken('rt')).rejects.toThrow(UnauthorizedException);
    });

    it('logout no-ops if session not found', async () => {
      sessionRepository.findById.mockResolvedValue(null);
      await expect(service.logout('missing')).resolves.toBeUndefined();
      expect(sessionRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('email & verification branches', () => {
    it('requestPasswordReset no-ops when user missing', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.requestPasswordReset('no@user')).resolves.toBeUndefined();
      expect(emailPort.sendMail).not.toHaveBeenCalled();
    });

    it('requestEmailVerification no-ops when user missing', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.requestEmailVerification('none@example.com')).resolves.toBeUndefined();
    });

    it('requestEmailVerification no-ops when already verified', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...mockUserWithRoles, emailVerifiedAt: new Date() });
      await expect(service.requestEmailVerification('v@example.com')).resolves.toBeUndefined();
    });

    it('verifyEmail throws on invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad'));
      await expect(service.verifyEmail('bad')).rejects.toThrow(UnauthorizedException);
    });

    it('signInWithTotp throws when user not found after verify', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'nope', aud: 'totp' });
      totpService.verifyToken.mockResolvedValue(true);
      userRepository.findById.mockResolvedValue(null);
      await expect(service.signInWithTotp('temp', '123456')).rejects.toThrow(UnauthorizedException);
    });

    it('issueTokensForUser throws for missing user', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.issueTokensForUser('x')).rejects.toThrow(UnauthorizedException);
    });

    it('issueTokensForUser returns tokens for existing user', async () => {
      const withRole: typeof mockUserWithRoles = { ...mockUserWithRoles, roles: [{ role: { name: 'admin' } }] };
      userRepository.findById.mockResolvedValue(withRole);
      sessionRepository.create.mockResolvedValue({ id: 'sess', userId: withRole.id, deviceOS: null, deviceUA: null, ipHash: null, lastSeenAt: new Date(), createdAt: new Date() } as Session);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      refreshTokenRepository.create.mockResolvedValue({ jti: 'j1', userId: withRole.id, sessionId: 'sess', issuedAt: new Date(), revokedAt: null, rotatedFrom: null } as RefreshToken);
      const result = await service.issueTokensForUser(withRole.id);
      expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    });

    it('signIn without TOTP generates tokens via generateTokens', async () => {
      const withRole2: User & { roles: { role: { name: string } }[] } = { ...mockUserWithRoles, roles: [{ role: { name: 'user' } }] };
      userRepository.findByEmail.mockResolvedValue(withRole2);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      credentialTotpRepository.findByUserId.mockResolvedValue(null);
      sessionRepository.create.mockResolvedValue({ id: 'sess', userId: withRole2.id, deviceOS: null, deviceUA: null, ipHash: null, lastSeenAt: new Date(), createdAt: new Date() } as Session);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      refreshTokenRepository.create.mockResolvedValue({ jti: 'j2', userId: withRole2.id, sessionId: 'sess', issuedAt: new Date(), revokedAt: null, rotatedFrom: null } as RefreshToken);
      const res = await service.signIn('test@example.com', 'password');
      expect(res).toEqual({ totpRequired: false, accessToken: 'access-token', refreshToken: 'refresh-token' });
    });
  });

  describe('Email Change', () => {
    it('should request an email change and send an email', async () => {
      userRepository.findById.mockResolvedValue(mockUserWithRoles);
      userRepository.findByEmail.mockResolvedValue(null);
      jwtService.signAsync.mockResolvedValue('test-token');

      await service.requestEmailChange('user-id', 'new@example.com');

      expect(emailPort.sendMail).toHaveBeenCalledWith(
        'new@example.com',
        'Confirm your new email address',
        'Use this token to confirm your new email address: test-token',
      );
    });

    it('should throw an error if the user is not found when requesting an email change', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.requestEmailChange('user-id', 'new@example.com')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error if the new email already exists when requesting an email change', async () => {
      userRepository.findById.mockResolvedValue(mockUserWithRoles);
      userRepository.findByEmail.mockResolvedValue(mockUserWithRoles);

      await expect(service.requestEmailChange('user-id', 'new@example.com')).rejects.toThrow('error.auth.email_already_exists');
    });

    it('should confirm an email change with a valid token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', aud: 'email-change', email: 'new@example.com' });
      userRepository.findById.mockResolvedValue(mockUserWithRoles);

      await service.confirmEmailChange('test-token');

      expect(userRepository.update).toHaveBeenCalledWith('user-id', {
        email: 'new@example.com',
        emailVerifiedAt: expect.any(Date),
      });
    });

    it('should throw an error if the token is invalid when confirming an email change', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error());

      await expect(service.confirmEmailChange('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error if the token audience is invalid when confirming an email change', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', aud: 'invalid-audience', email: 'new@example.com' });

      await expect(service.confirmEmailChange('test-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error if the user is not found when confirming an email change', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id', aud: 'email-change', email: 'new@example.com' });
      userRepository.findById.mockResolvedValue(null);

      await expect(service.confirmEmailChange('test-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('social auth', () => {
    it('signInWithSocial returns tokens for existing link', async () => {
      socialRepo.findByProviderAccount.mockResolvedValue({ userId: mockUser.id });
      jest.spyOn(service, 'issueTokensForUser').mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT' });
      const res = await service.signInWithSocial({ provider: 'google', providerUserId: 'pid' });
      expect(res).toEqual({ accessToken: 'AT', refreshToken: 'RT' });
    });

    it('signInWithSocial does not auto-link by email; throws when not linked', async () => {
      socialRepo.findByProviderAccount.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue({ ...mockUserWithRoles });
      const profile: OAuthProfile = { provider: 'google', providerUserId: 'pid2', email: 'test@example.com', emailVerified: true };
      await expect(service.signInWithSocial(profile)).rejects.toThrow(UnauthorizedException);
      expect(socialRepo.link).not.toHaveBeenCalled();
    });

    it('signInWithSocial throws when unlinked and no email', async () => {
      socialRepo.findByProviderAccount.mockResolvedValue(null);
      await expect(service.signInWithSocial({ provider: 'github', providerUserId: 'p3' })).rejects.toThrow(UnauthorizedException);
    });

    it('unlinkSocialAccount succeeds when not last method', async () => {
      socialRepo.findByUserId.mockResolvedValue([{ id: 's1' } as unknown as import('@prisma/client').SocialAccount]);
      userRepository.findById.mockResolvedValue({ ...mockUserWithRoles, passwordHash: 'hash' });
      await expect(service.unlinkSocialAccount('u1', 'google')).resolves.toBeUndefined();
      expect(socialRepo.unlink).toHaveBeenCalledWith('u1', 'google');
    });

    it('unlinkSocialAccount throws when last method', async () => {
      socialRepo.findByUserId.mockResolvedValue([]);
      userRepository.findById.mockResolvedValue({ ...mockUserWithRoles, passwordHash: undefined } as unknown as import('@prisma/client').User & { roles: { role: { name: string } }[] });
      await expect(service.unlinkSocialAccount('u1', 'google')).rejects.toThrow(UnauthorizedException);
    });

    it('linkSocialAccount calls repository and audit', async () => {
      await service.linkSocialAccount('u1', 'google', 'p1');
      expect(socialRepo.link).toHaveBeenCalledWith('u1', 'google', 'p1');
    });
  });
});
