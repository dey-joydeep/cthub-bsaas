import {
  CREDENTIAL_TOTP_REPOSITORY,
  ICredentialTotpRepository,
  IRefreshTokenRepository,
  ISessionRepository,
  IUserRepository,
  REFRESH_TOKEN_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '@cthub-bsaas/server-contracts-auth';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TOTP_PORT, TotpPort, EMAIL_PORT, EmailPort } from '@cthub-bsaas/server-contracts-auth';
import { PASSWORD_RESET_REPOSITORY, IPasswordResetRepository } from '@cthub-bsaas/server-contracts-auth';
import { EMAIL_VERIFICATION_REPOSITORY, IEmailVerificationRepository } from '@cthub-bsaas/server-contracts-auth';
import { AuditService } from './audit.service';
import type { AuthSignInResult, TokenPair } from '../types/auth.types';
import { SOCIAL_ACCOUNT_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import type { OAuthProfile } from '@cthub-bsaas/server-contracts-auth';
import { AUTH_ERROR_CODES } from '@cthub-bsaas/shared';
import { Prisma } from '@prisma/client';

import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * @public
 * Domain service responsible for authentication flows, sessions, refresh token rotation
 * and multi-factor enrollment and verification.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(SOCIAL_ACCOUNT_REPOSITORY) private readonly socialAccountRepository: import('@cthub-bsaas/server-contracts-auth').ISocialAccountRepository,
    @Inject(CREDENTIAL_TOTP_REPOSITORY) private readonly credentialTotpRepository: ICredentialTotpRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(TOTP_PORT) private readonly totpService: TotpPort,
    @Inject(EMAIL_PORT) private readonly emailPort: EmailPort,
    @Inject(EMAIL_VERIFICATION_REPOSITORY) private readonly emailVerRepo: IEmailVerificationRepository,
    @Inject(PASSWORD_RESET_REPOSITORY) private readonly pwdResetRepo: IPasswordResetRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Register a new Customer (Customer‑only registration).
   *
   * - Customer self‑service registration
   * - Hashes password
   * - Assigns default CUSTOMER role
   * - Issues email verification OTP
   *
   * @remarks
   * CUSTOMER-ONLY: Partner/Admin onboarding is handled via invite/internal provisioning
   * in separate flows/endpoints; not supported by this method.
   *
   * @public
   * @param email new user's email
   * @param password plain text password
   * @param name optional display name
   */
  public async register(email: string, password: string, name?: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      // Do not reveal existence; optionally re-send verification if unverified
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
        create: [{
          role: {
            connect: { name: 'CUSTOMER' },
          },
        }],
      },
    } as unknown as Prisma.UserCreateInput;
    const user = await this.userRepository.create(data as unknown as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);
    await this.requestEmailVerification(user.email);
    this.audit.log('register_success', { userId: user.id });
  }

    /**
     * Sign in with email/password. If TOTP is enabled, returns a temp token for second factor.
     *
     * @public
     * @param {string} email - User email.
     * @param {string} pass - Plain text password.
     * @returns {Promise<{ totpRequired: boolean; tempToken?: string; accessToken?: string; refreshToken?: string }>} Token payload or TOTP challenge.
     */
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
          secret:
            this.configService.get<string>('JWT_ACCESS_SECRET') ||
            this.configService.get<string>('JWT_SECRET') ||
            'test-access-secret',
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

  /**
   * Complete a TOTP challenge using a temp token.
   *
   * @public
   * @param {string} tempToken - JWT issued after password validation.
   * @param {string} totpCode - The 6-digit TOTP code.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} New token pair.
   */
  public async signInWithTotp(tempToken: string, totpCode: string): Promise<TokenPair> {
    try {
      const { sub, aud } = await this.jwtService.verifyAsync<{ sub: string; aud: string }>(tempToken, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
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

  /**
   * Validate and rotate a refresh token, issuing a new access token and refresh token.
   *
   * @public
   * @param {string} token - The refresh token (from cookie or body).
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} Rotated tokens.
   */
  public async refreshToken(token: string): Promise<TokenPair | null> {
    try {
      const { sub, jti } = await this.jwtService.verifyAsync<{ sub: string; jti: string }>(token, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET') ||
          'test-refresh-secret',
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

      // Invalidate the old refresh token
      await this.refreshTokenRepository.revoke(jti);

      const tokens = await this.generateTokens(user, storedToken.sessionId);
      this.audit.log('refresh_success', { userId: user.id, sessionId: storedToken.sessionId });
      return tokens;
    } catch {
      this.audit.log('refresh_failure', { result: 'failure', reason: 'invalid_refresh_token' });
      throw new UnauthorizedException(AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN);
    }
  }

  /**
   * Revoke the provided session id.
   *
   * @public
   * @param {string} sessionId - Session id to revoke.
   * @returns {Promise<void>} Resolves after revocation.
   */
  public async logout(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (session) {
      await this.sessionRepository.delete(sessionId);
      this.audit.log('logout', { userId: session.userId, sessionId });
    }
  }

  /**
   * List active sessions for a user.
   *
   * @public
   * @param {string} userId - User id whose sessions to list.
   * @returns {Promise<unknown>} Array of sessions.
   */
  public async listSessions(userId: string): Promise<unknown> {
    return this.sessionRepository.findByUserId(userId);
  }

  /**
   * Revoke a specific session owned by the user.
   *
   * @public
   * @param {string} userId - Owner user id.
   * @param {string} sessionId - Session id to revoke.
   * @returns {Promise<{ success: true }>} Success response.
   */
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

  /**
   * Generate an access/refresh token pair and persist the refresh token metadata.
   *
   * @private
   * @param {User & { roles: { role: { name: string } }[] }} user - Authenticated user with roles.
   * @param {string} sessionId - Active session id.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} Signed tokens.
   */
  private async generateTokens(
    user: User & { roles: { role: { name: string } }[] },
    sessionId: string,
  ): Promise<TokenPair> {
    const jti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          sessionId,
          roles: user.roles.map(
            (userRole: { role: { name: string } }) => userRole.role.name,
          ),
        },
        {
          secret:
            this.configService.get<string>('JWT_ACCESS_SECRET') ||
            this.configService.get<string>('JWT_SECRET') ||
            'test-access-secret',
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: user.id, jti },
        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            this.configService.get<string>('JWT_SECRET') ||
            'test-refresh-secret',
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);

    await this.refreshTokenRepository.create({ jti, userId: user.id, sessionId });

    return { accessToken, refreshToken };
  }

  /**
   * Issue tokens for an existing user by id (used after WebAuthn login).
   *
   * @public
   * @param {string} userId - User id to authenticate.
   * @returns {Promise<TokenPair>} New token pair bound to a new session.
   */
  public async issueTokensForUser(userId: string): Promise<TokenPair> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
    const session = await this.sessionRepository.create({ userId: user.id });
    return this.generateTokens(user, session.id);
  }

  /**
   * Resolve a user's id by email, used for unauthenticated WebAuthn start.
   * @public
   * @param {string} email target email address
   * @returns {Promise<string>} user id when found
   */
  public async resolveUserIdByEmail(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedException(AUTH_ERROR_CODES.USER_NOT_FOUND);
    return user.id;
  }

  /** Sign in using a social profile: link by provider or email, or create minimal user if policy allows. */
  public async signInWithSocial(profile: OAuthProfile): Promise<TokenPair> {
    // 1) Existing link only; do not auto-link by email in unauthenticated flow
    const existing = await this.socialAccountRepository.findByProviderAccount(profile.provider, profile.providerUserId);
    const userId = existing?.userId;
    if (!userId) {
      // Frontend i18n hint: prompt user to log in first, then link provider in settings
      throw new UnauthorizedException(AUTH_ERROR_CODES.OAUTH_LINK_REQUIRED);
    }
    return this.issueTokensForUser(userId);
  }

  /** Link a social account to current user. */
  public async linkSocialAccount(userId: string, provider: string, providerUserId: string): Promise<void> {
    await this.socialAccountRepository.link(userId, provider, providerUserId);
    this.audit.log('oauth_link', { userId, provider });
  }

  /** Unlink a social account; prevent removal of last sign-in method. */
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

  // Account recovery: password reset
  /**
   * Send a one-time password reset token to the provided email.
   *
   * @public
   * @param {string} email - Target email address.
   * @returns {Promise<void>} Resolves once the message is queued.
   */
  public async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return; // Avoid account enumeration
    const id = randomUUID();
    const secret = randomUUID().replace(/-/g, '');
    const tokenHash = await bcrypt.hash(secret, 10);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h
    await this.pwdResetRepo.create({ id, userId: user.id, tokenHash, expiresAt });
    const token = `${id}.${secret}`;
    await this.emailPort.sendMail(user.email, 'Password Reset', `Use this token to reset your password: ${token}`);
    this.audit.log('password_reset_requested', { userId: user.id });
  }

  /**
   * Reset a user's password using a valid reset token.
   *
   * @public
   * @param {string} token - Password reset token.
   * @param {string} newPassword - New plain text password.
   * @returns {Promise<void>} Resolves after updating the password hash.
   */
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
    // Revoke all sessions for this user after reset
    const sessions = (await this.sessionRepository.findByUserId(rec.userId)) as { id: string }[];
    for (const s of sessions) {
      await this.sessionRepository.delete(s.id);
    }
    this.audit.log('password_reset_confirmed', { userId: rec.userId, revokedSessions: sessions.length });
  }

  // Email verification
  /**
   * Send an email verification token to a user (no-op if already verified).
   *
   * @public
   * @param {string} email - Target email address.
   * @returns {Promise<void>} Resolves once the message is queued.
   */
  public async requestEmailVerification(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.emailVerifiedAt) return;
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6 digits
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.emailVerRepo.upsertForEmail(user.email, codeHash, expiresAt);
    await this.emailPort.sendMail(
      user.email,
      'Verify your email',
      `Your verification code is: ${otp}. It expires in 10 minutes.`,
    );
    this.audit.log('email_verification_requested', { userId: user.id });
  }

  /**
   * Verify a user's email address using a verification token.
   *
   * @public
   * @param {string} token - Verification token.
   * @returns {Promise<void>} Resolves after marking the email as verified.
   */
  public async verifyEmail(token: string): Promise<void> {
    try {
      const verifySecret = this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET') || this.configService.get<string>('JWT_ACCESS_SECRET')!;
      const { sub, aud } = await this.jwtService.verifyAsync<{ sub: string; aud: string }>(token, {
        secret: verifySecret,
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

  /**
   * Verify email via OTP code (DB-backed).
   * @param email target email
   * @param otp 6-digit string
   */
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
