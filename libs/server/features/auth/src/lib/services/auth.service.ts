import {
  CREDENTIAL_TOTP_REPOSITORY,
  ICredentialTotpRepository,
  IRefreshTokenRepository,
  ISessionRepository,
  IUserRepository,
  REFRESH_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
  SOCIAL_ACCOUNT_REPOSITORY,
  ISocialAccountRepository,
  PASSWORD_RESET_REPOSITORY,
  IPasswordResetRepository,
  EMAIL_VERIFICATION_REPOSITORY,
  IEmailVerificationRepository,
  INVITE_PORT,
  InvitePort,
  TOTP_PORT,
  TotpPort,
  EMAIL_PORT,
  EmailPort,
} from '@cthub-bsaas/server-contracts-auth';
import { BadRequestException, Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@cthub-bsaas/server-core';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from './audit.service';
import type { AuthSignInResult, TokenPair } from '../types/auth.types';
import type { OAuthProfile } from '@cthub-bsaas/server-contracts-auth';
import { AUTH_ERROR_CODES } from '@cthub-bsaas/shared';
import { Prisma, User } from '@prisma/client';
import { RegistrationCompleteInput } from '@cthub-bsaas/server-contracts-auth';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  private readonly userRepository: IUserRepository;
  private readonly sessionRepository: ISessionRepository;
  private readonly refreshTokenRepository: IRefreshTokenRepository;
  private readonly socialAccountRepository: ISocialAccountRepository;
  private readonly credentialTotpRepository: ICredentialTotpRepository;
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;
  private readonly totpService: TotpPort;
  private readonly emailPort: EmailPort;
  private readonly emailVerRepo: IEmailVerificationRepository;
  private readonly pwdResetRepo: IPasswordResetRepository;
  private readonly audit: AuditService;
  private readonly invitePort?: InvitePort;

  constructor(
    @Inject(USER_REPOSITORY) userRepository: IUserRepository,
    @Inject(SESSION_REPOSITORY) sessionRepository: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) refreshTokenRepository: IRefreshTokenRepository,
    @Inject(SOCIAL_ACCOUNT_REPOSITORY) socialAccountRepository: ISocialAccountRepository,
    @Inject(CREDENTIAL_TOTP_REPOSITORY) credentialTotpRepository: ICredentialTotpRepository,
    jwtService: JwtService,
    configService: ConfigService,
    @Inject(TOTP_PORT) totpService: TotpPort,
    @Inject(EMAIL_PORT) emailPort: EmailPort,
    @Inject(EMAIL_VERIFICATION_REPOSITORY) emailVerRepo: IEmailVerificationRepository,
    @Inject(PASSWORD_RESET_REPOSITORY) pwdResetRepo: IPasswordResetRepository,
    audit: AuditService,
    @Optional() @Inject(INVITE_PORT) invitePort?: InvitePort,
  ) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.socialAccountRepository = socialAccountRepository;
    this.credentialTotpRepository = credentialTotpRepository;
    this.jwtService = jwtService;
    this.configService = configService;
    this.totpService = totpService;
    this.emailPort = emailPort;
    this.emailVerRepo = emailVerRepo;
    this.pwdResetRepo = pwdResetRepo;
    this.audit = audit;
    this.invitePort = invitePort;
  }

  public async register(email: string, password: string, name?: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      if (!existing.emailVerifiedAt) {
        await this.requestEmailVerification(email);
      }
      this.audit.log('register_existing', { userId: existing.id });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const data: Prisma.UserCreateInput = {
      email,
      passwordHash,
      name: name ?? null,
      isActive: true,
      roles: {
        create: [{ role: { connect: { name: 'CUSTOMER' } } }],
      },
    };
    const user = await this.userRepository.create(
      data as unknown as Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
    );
    await this.requestEmailVerification(user.email);
    this.audit.log('register_success', { userId: user.id });
  }

  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    if (currentPassword === newPassword) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { passwordHash });
    this.audit.log('password_change_success', { userId });
  }

  public async requestEmailChange(userId: string, newEmail: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
    }
    const existingUser = await this.userRepository.findByEmail(newEmail);
    if (existingUser) {
      throw new BadRequestException(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }
    const token = await this.jwtService.signAsync(
      { sub: userId, aud: 'email-change', email: newEmail },
      {
        secret: this.configService.auth.jwtEmailChangeSecret,
        expiresIn: '10m',
      },
    );
    await this.emailPort.sendMail(
      newEmail,
      'Confirm your new email address',
      `Use this token to confirm your new email address: ${token}`,
    );
    this.audit.log('email_change_requested', { userId });
  }

  public async confirmEmailChange(token: string): Promise<void> {
    try {
      const { sub, aud, email } = await this.jwtService.verifyAsync<{ sub: string; aud: string; email: string }>(
        token,
        {
          secret: this.configService.auth.jwtEmailChangeSecret,
        },
      );
      if (aud !== 'email-change') {
        this.audit.log('email_change_failure', { result: 'failure', reason: 'invalid_audience' });
        throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_VERIFY_TOKEN);
      }
      const user = await this.userRepository.findById(sub);
      if (!user) {
        this.audit.log('email_change_failure', { result: 'failure', reason: 'user_not_found' });
        throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
      }
      await this.userRepository.update(user.id, { email, emailVerifiedAt: new Date() } as Partial<User>);
      this.audit.log('email_change_success', { userId: user.id });
    } catch {
      this.audit.log('email_change_failure', { result: 'failure', reason: 'invalid_or_expired_token' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_VERIFY_TOKEN);
    }
  }

  public async signIn(email: string, pass: string): Promise<AuthSignInResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      this.audit.log('login_password_failure', { result: 'failure', reason: 'invalid_credentials' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
      this.audit.log('login_password_failure', { result: 'failure', reason: 'invalid_credentials', userId: user.id });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }
    const totpCredential = await this.credentialTotpRepository.findByUserId(user.id);
    if (totpCredential && totpCredential.verified) {
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, aud: 'totp' },
        {
          secret: this.configService.auth.jwtAccessSecret,
          expiresIn: '5m',
        },
      );
      this.audit.log('login_password_totp_challenge', { userId: user.id });
      return { totpRequired: true, tempToken };
    }
    const session = await this.sessionRepository.create({ userId: user.id });
    const { accessToken, refreshToken } = await this.generateTokens(user, session.id);
    this.audit.log('login_password_success', { userId: user.id, sessionId: session.id });
    return { totpRequired: false, accessToken, refreshToken };
  }

  public async signInWithTotp(tempToken: string, totpCode: string): Promise<TokenPair> {
    try {
      const { sub, aud } = await this.jwtService.verifyAsync<{ sub: string; aud: string }>(tempToken, {
        secret: this.configService.auth.jwtAccessSecret,
      });
      if (aud !== 'totp') {
        this.audit.log('login_totp_failure', { result: 'failure', reason: 'invalid_totp_token' });
        throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_TOTP_TOKEN);
      }
      const isTotpValid = await this.totpService.verifyToken(sub, totpCode);
      if (!isTotpValid) {
        this.audit.log('login_totp_failure', { result: 'failure', reason: 'invalid_totp_code', userId: sub });
        throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_TOTP_CODE);
      }
      const user = await this.userRepository.findById(sub);
      if (!user) {
        this.audit.log('login_totp_failure', { result: 'failure', reason: 'user_not_found', userId: sub });
        throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
      }
      const session = await this.sessionRepository.create({ userId: user.id });
      const tokens = await this.generateTokens(user, session.id);
      this.audit.log('login_totp_success', { userId: user.id, sessionId: session.id });
      return tokens;
    } catch {
      this.audit.log('login_totp_failure', { result: 'failure', reason: 'invalid_or_expired_totp' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOTP);
    }
  }

  public async refreshToken(token: string): Promise<TokenPair | null> {
    try {
      const { sub, jti } = await this.jwtService.verifyAsync<{ sub: string; jti: string }>(token, {
        secret: this.configService.auth.jwtRefreshSecret,
      });
      const storedToken = await this.refreshTokenRepository.findByJti(jti);
      if (!storedToken || storedToken.revokedAt) {
        this.audit.log('refresh_failure', { result: 'failure', reason: 'invalid_refresh_token' });
        throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN);
      }
      const user = await this.userRepository.findById(sub);
      if (!user) {
        this.audit.log('refresh_failure', { result: 'failure', reason: 'user_not_found', sessionId: storedToken.sessionId });
        throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
      }
      await this.refreshTokenRepository.revoke(jti);
      const tokens = await this.generateTokens(user, storedToken.sessionId);
      this.audit.log('refresh_success', { userId: user.id, sessionId: storedToken.sessionId });
      return tokens;
    } catch {
      this.audit.log('refresh_failure', { result: 'failure', reason: 'invalid_refresh_token' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN);
    }
  }

  public async logout(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (session) {
      await this.sessionRepository.delete(sessionId);
      this.audit.log('logout', { userId: session.userId, sessionId });
    }
  }

  public async listSessions(userId: string): Promise<unknown> {
    return this.sessionRepository.findByUserId(userId);
  }

  public async revokeSession(userId: string, sessionId: string): Promise<{ success: true }> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      this.audit.log('session_revoke_failure', { result: 'failure', reason: 'not_owner', userId, sessionId });
      throw new UnauthorizedException(AUTH_ERROR_CODES.CANNOT_REVOKE_SESSION);
    }
    await this.sessionRepository.delete(sessionId);
    this.audit.log('session_revoked', { userId, sessionId });
    return { success: true };
  }

  private async generateTokens(
    user: User & { roles: { role: { name: string } }[] },
    sessionId: string,
  ): Promise<TokenPair> {
    const jti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, sessionId, roles: user.roles.map((userRole) => userRole.role.name) },
        {
          secret: this.configService.auth.jwtAccessSecret,
          expiresIn: this.configService.auth.jwtExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        { sub: user.id, jti },
        {
          secret: this.configService.auth.jwtRefreshSecret,
          expiresIn: this.configService.auth.refreshTokenExpiresIn,
        },
      ),
    ]);
    await this.refreshTokenRepository.create({ jti, userId: user.id, sessionId });
    return { accessToken, refreshToken };
  }

  public async issueTokensForUser(userId: string): Promise<TokenPair> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
    const session = await this.sessionRepository.create({ userId: user.id });
    return this.generateTokens(user, session.id);
  }

  public async validateOwnerInvite(token: string): Promise<{ email: string; salonId: string }> {
    if (!this.invitePort) throw new BadRequestException('error.not_implemented');
    const res = await this.invitePort.validateOwner(token);
    this.audit.log('owner_invite_validate', { email: res.email });
    return { email: res.email, salonId: res.salonId };
  }

  public async completeOwnerRegistration(input: RegistrationCompleteInput): Promise<TokenPair | { next: 'mfa' }> {
    if (!this.invitePort) throw new BadRequestException('error.not_implemented');
    const res = await this.invitePort.completeOwner(input);
    if (res.requireMfa) {
      this.audit.log('owner_registration_requires_mfa', { userId: res.userId });
      return { next: 'mfa' } as const;
    }
    const tokens = await this.issueTokensForUser(res.userId);
    this.audit.log('owner_registration_complete', { userId: res.userId });
    return tokens;
  }

  public async validateStaffInvite(token: string): Promise<{ email: string; salonId: string; role?: string }> {
    if (!this.invitePort) throw new BadRequestException('error.not_implemented');
    const res = await this.invitePort.validateStaff(token);
    this.audit.log('staff_invite_validate', { email: res.email });
    return { email: res.email, salonId: res.salonId, role: res.role };
  }

  public async completeStaffRegistration(input: RegistrationCompleteInput): Promise<TokenPair | { next: 'mfa' }> {
    if (!this.invitePort) throw new BadRequestException('error.not_implemented');
    const res = await this.invitePort.completeStaff(input);
    if (res.requireMfa) {
      this.audit.log('staff_registration_requires_mfa', { userId: res.userId });
      return { next: 'mfa' } as const;
    }
    const tokens = await this.issueTokensForUser(res.userId);
    this.audit.log('staff_registration_complete', { userId: res.userId });
    return tokens;
  }

  public async resolveUserIdByEmail(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
    return user.id;
  }

  public async signInWithSocial(profile: OAuthProfile): Promise<TokenPair> {
    const existing = await this.socialAccountRepository.findByProviderAccount(profile.provider, profile.providerUserId);
    const userId = existing?.userId;
    if (!userId) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.OAUTH_LINK_REQUIRED);
    }
    return this.issueTokensForUser(userId);
  }

  public async linkSocialAccount(userId: string, provider: string, providerUserId: string): Promise<void> {
    await this.socialAccountRepository.link(userId, provider, providerUserId);
    this.audit.log('oauth_link', { userId, provider });
  }

  public async unlinkSocialAccount(userId: string, provider: string): Promise<void> {
    const socials = await this.socialAccountRepository.findByUserId(userId);
    const user = await this.userRepository.findById(userId);
    const hasPassword = !!user?.passwordHash;
    const methods = socials.length + (hasPassword ? 1 : 0);
    if (methods <= 1) {
      throw new UnauthorizedException(AUTH_ERROR_CODES.CANNOT_UNLINK_LAST_METHOD);
    }
    await this.socialAccountRepository.unlink(userId, provider);
    this.audit.log('oauth_unlink', { userId, provider });
  }

  public async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;
    const id = randomUUID();
    const secret = randomUUID().replace(/-/g, '');
    const tokenHash = await bcrypt.hash(secret, 10);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.pwdResetRepo.create({ id, userId: user.id, tokenHash, expiresAt });
    const token = `${id}.${secret}`;
    await this.emailPort.sendMail(user.email, 'Password Reset', `Use this token to reset your password: ${token}`);
    this.audit.log('password_reset_requested', { userId: user.id });
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const [id, providedSecret] = token.split('.', 2);
    if (!id || !providedSecret) {
      this.audit.log('password_reset_failure', { result: 'failure', reason: 'malformed_token' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_RESET_TOKEN);
    }
    const rec = await this.pwdResetRepo.findById(id);
    if (!rec || rec.usedAt || rec.expiresAt.getTime() < Date.now()) {
      this.audit.log('password_reset_failure', { result: 'failure', reason: 'expired_or_used' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_RESET_TOKEN);
    }
    const ok = await bcrypt.compare(providedSecret, rec.tokenHash);
    if (!ok) {
      this.audit.log('password_reset_failure', { result: 'failure', reason: 'secret_mismatch', userId: rec.userId });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_RESET_TOKEN);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(rec.userId, { passwordHash } as Partial<User>);
    await this.pwdResetRepo.markUsed(rec.id);
    const sessions = (await this.sessionRepository.findByUserId(rec.userId)) as { id: string }[];
    for (const s of sessions) {
      await this.sessionRepository.delete(s.id);
    }
    this.audit.log('password_reset_confirmed', { userId: rec.userId, revokedSessions: sessions.length });
  }

  public async requestEmailVerification(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.emailVerifiedAt) return;
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.emailVerRepo.upsertForEmail(user.email, codeHash, expiresAt);
    await this.emailPort.sendMail(
      user.email,
      'Verify your email',
      `Your verification code is: ${otp}. It expires in 10 minutes.`,
    );
    this.audit.log('email_verification_requested', { userId: user.id });
  }

  public async verifyEmail(token: string): Promise<void> {
    try {
      const { sub, aud } = await this.jwtService.verifyAsync<{ sub: string; aud: string }>(token, {
        secret: this.configService.auth.jwtVerifyEmailSecret,
      });
      if (aud !== 'verify') {
        this.audit.log('email_verify_failure', { result: 'failure', reason: 'invalid_audience', userId: sub });
        throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_VERIFY_TOKEN);
      }
      await this.userRepository.update(sub, { emailVerifiedAt: new Date() } as Partial<User>);
      this.audit.log('email_verified', { userId: sub });
    } catch {
      this.audit.log('email_verify_failure', { result: 'failure', reason: 'invalid_or_expired_token' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OR_EXPIRED_VERIFY_TOKEN);
    }
  }

  public async verifyEmailOtp(email: string, otp: string): Promise<void> {
    const rec = await this.emailVerRepo.findActiveByEmail(email);
    if (!rec) {
      this.audit.log('email_verify_otp_failure', { result: 'failure', reason: 'otp_expired' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.OTP_EXPIRED);
    }
    await this.emailVerRepo.incrementAttempts(rec.id);
    const ok = await bcrypt.compare(otp, rec.codeHash);
    if (!ok) {
      this.audit.log('email_verify_otp_failure', { result: 'failure', reason: 'invalid_otp' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_OTP);
    }
    await this.emailVerRepo.markUsed(rec.id);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.audit.log('email_verify_otp_failure', { result: 'failure', reason: 'user_not_found' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
    }
    await this.userRepository.update(user.id, { emailVerifiedAt: new Date() } as Partial<User>);
    this.audit.log('email_verified', { userId: user.id });
  }
}