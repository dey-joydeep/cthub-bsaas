import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ConfigService } from '@cthub-bsaas/server-core';
import { AuthService } from '../../../src/lib/services/auth.service';
import { setupAuthIntegrationHarness, AuthIntegrationHarness } from '../utils/auth-integration.harness';

const NEW_PASSWORD = 'NewPassword#1';

/**
 * Exercises AuthService branches that are difficult to trigger via the high-level controller specs.
 * These tests keep the full Nest testing container so that real Prisma repositories, JWT secrets,
 * and adapters are used while we drive error/edge scenarios directly against the service layer.
 */
describe('AuthService (integration edge cases)', () => {
  let harness: AuthIntegrationHarness;
  let service: AuthService;
  let jwt: JwtService;
  let config: ConfigService;

  beforeEach(async () => {
    harness = await setupAuthIntegrationHarness();
    service = harness.app.get(AuthService);
    jwt = harness.app.get(JwtService);
    config = harness.app.get(ConfigService);
    await harness.resetThrottle();
  });

  afterEach(async () => {
    await harness.cleanupUsers();
    harness.resetEmails();
    await harness.resetThrottle();
    await harness.close();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    harness = undefined as any;
  });

  describe('register existing users', () => {
    it('re-sends verification when the existing user is unverified', async () => {
      const email = `edge-existing-${randomUUID()}@example.com`;
      await harness.registerUser({ email, isVerified: false, emailVerifiedAt: null, password: 'Password#1' });
      harness.resetEmails();

      await service.register(email, 'Password#1');

      expect(harness.sentEmails.length).toBeGreaterThan(0);
      expect(harness.sentEmails[0].subject).toContain('Verify');
    });

    it('no-ops when the existing user is already verified', async () => {
      const email = `edge-verified-${randomUUID()}@example.com`;
      await harness.registerUser({ email, isVerified: true, emailVerifiedAt: new Date(), password: 'Password#1' });
      harness.resetEmails();

      await service.register(email, 'Password#1');

      expect(harness.sentEmails).toHaveLength(0);
    });
  });

  describe('changePassword validations', () => {
    it('rejects when the user is missing or the current password is invalid/unchanged', async () => {
      await expect(service.changePassword(randomUUID(), 'whatever', NEW_PASSWORD)).rejects.toThrow(UnauthorizedException);

      const user = await harness.registerUser({ password: 'Cur#1' });
      await expect(service.changePassword(user.id, 'wrong', NEW_PASSWORD)).rejects.toThrow(UnauthorizedException);
      await expect(service.changePassword(user.id, 'Cur#1', 'Cur#1')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestEmailChange', () => {
    it('requires an existing user and a unique destination email', async () => {
      await expect(service.requestEmailChange(randomUUID(), 'nobody@example.com')).rejects.toThrow(UnauthorizedException);

      const primary = await harness.registerUser({ email: `primary-${randomUUID()}@example.com` });
      const clash = await harness.registerUser({ email: `taken-${randomUUID()}@example.com` });
      await expect(service.requestEmailChange(primary.id, clash.email)).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmEmailChange failure paths', () => {
    it('throws for malformed tokens, invalid audiences, and unknown users', async () => {
      await expect(service.confirmEmailChange('not-a-jwt')).rejects.toThrow(UnauthorizedException);

      const user = await harness.registerUser({ email: `aud-${randomUUID()}@example.com` });
      const invalidAudience = await jwt.signAsync(
        { sub: user.id, aud: 'wrong', email: `new-${randomUUID()}@example.com` },
        { secret: config.auth.jwtEmailChangeSecret, expiresIn: '5m' },
      );
      await expect(service.confirmEmailChange(invalidAudience)).rejects.toThrow(UnauthorizedException);

      const missingUserToken = await jwt.signAsync(
        { sub: randomUUID(), aud: 'email-change', email: `ghost-${randomUUID()}@example.com` },
        { secret: config.auth.jwtEmailChangeSecret, expiresIn: '5m' },
      );
      await expect(service.confirmEmailChange(missingUserToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken negative cases', () => {
    it('rejects missing, malformed, revoked, and orphaned refresh tokens', async () => {
      const missingUser = await harness.registerUser();
      const missingToken = await jwt.signAsync(
        { sub: missingUser.id, jti: randomUUID() },
        { secret: config.auth.jwtRefreshSecret, expiresIn: '5m' },
      );
      await expect(service.refreshToken(missingToken)).rejects.toThrow(UnauthorizedException);

      await expect(service.refreshToken('this-is-not-jwt')).rejects.toThrow(UnauthorizedException);

      const user = await harness.registerUser({ email: `refresh-${randomUUID()}@example.com` });
      const session = await harness.prisma.session.create({ data: { userId: user.id } });
      const revokedJti = randomUUID();
      await harness.prisma.refreshToken.create({
        data: { jti: revokedJti, userId: user.id, sessionId: session.id, revokedAt: new Date() },
      });
      const revokedToken = await jwt.signAsync({ sub: user.id, jti: revokedJti }, {
        secret: config.auth.jwtRefreshSecret,
        expiresIn: '5m',
      });
      await expect(service.refreshToken(revokedToken)).rejects.toThrow(UnauthorizedException);

      const activeJti = randomUUID();
      await harness.prisma.refreshToken.create({
        data: { jti: activeJti, userId: user.id, sessionId: session.id },
      });
      const missingUserId = randomUUID();
      const mismatchedToken = await jwt.signAsync({ sub: missingUserId, jti: activeJti }, {
        secret: config.auth.jwtRefreshSecret,
        expiresIn: '5m',
      });
      await expect(service.refreshToken(mismatchedToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('session and token helpers', () => {
    it('throws when attempting to revoke another user\'s session', async () => {
      const owner = await harness.registerUser();
      const stranger = await harness.registerUser({ email: `stranger-${randomUUID()}@example.com` });
      const session = await harness.prisma.session.create({ data: { userId: stranger.id } });
      await expect(service.revokeSession(owner.id, session.id)).rejects.toThrow(UnauthorizedException);
    });

    it('throws when issuing tokens for a missing user', async () => {
      await expect(service.issueTokensForUser(randomUUID())).rejects.toThrow(UnauthorizedException);
    });

    it('resolveUserIdByEmail rejects missing users', async () => {
      await expect(service.resolveUserIdByEmail(`missing-${randomUUID()}@example.com`)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signInWithTotp, social auth, and unlink safeguards', () => {
    it('enforces totp audience validation before verifying the code', async () => {
      const wrongAudienceToken = await jwt.signAsync(
        { sub: randomUUID(), aud: 'not-totp' },
        { secret: config.auth.jwtAccessSecret, expiresIn: '5m' },
      );
      await expect(service.signInWithTotp(wrongAudienceToken, '000000')).rejects.toThrow(UnauthorizedException);
    });

    it('requires an existing social link for sign-in', async () => {
      await expect(service.signInWithSocial({ provider: 'google', providerUserId: `pid-${randomUUID()}` })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('prevents unlinking the last authentication method', async () => {
      const user = await harness.registerUser();
      await harness.prisma.user.update({ where: { id: user.id }, data: { passwordHash: '' } });
      await expect(service.unlinkSocialAccount(user.id, 'google')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('password reset scenarios', () => {
    it('gracefully ignores reset requests for unknown users', async () => {
      await expect(service.requestPasswordReset(`ghost-${randomUUID()}@example.com`)).resolves.toBeUndefined();
    });

    it('throws for malformed, expired, used, and mismatched reset tokens', async () => {
      const user = await harness.registerUser();
      await expect(service.resetPassword('malformed-token', NEW_PASSWORD)).rejects.toThrow(UnauthorizedException);

      const expired = await harness.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: await bcrypt.hash('secret-expired', 10),
          expiresAt: new Date(Date.now() - 10_000),
        },
      });
      await expect(service.resetPassword(`${expired.id}.secret-expired`, NEW_PASSWORD)).rejects.toThrow(UnauthorizedException);

      const used = await harness.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: await bcrypt.hash('secret-used', 10),
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: new Date(),
        },
      });
      await expect(service.resetPassword(`${used.id}.secret-used`, NEW_PASSWORD)).rejects.toThrow(UnauthorizedException);

      const mismatch = await harness.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: await bcrypt.hash('secret-correct', 10),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
      await expect(service.resetPassword(`${mismatch.id}.wrong-secret`, NEW_PASSWORD)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('email verification helpers', () => {
    it('ignores verification requests for missing or already verified users', async () => {
      await expect(service.requestEmailVerification(`ghost-${randomUUID()}@example.com`)).resolves.toBeUndefined();

      const verified = await harness.registerUser({ email: `verified-${randomUUID()}@example.com` });
      await expect(service.requestEmailVerification(verified.email)).resolves.toBeUndefined();
    });

    it('throws for invalid verification tokens', async () => {
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('handles OTP failures (missing, mismatch, user missing)', async () => {
      const missingRecordEmail = `otp-missing-${randomUUID()}@example.com`;
      await expect(service.verifyEmailOtp(missingRecordEmail, '123456')).rejects.toThrow(UnauthorizedException);

      const otpUser = await harness.registerUser({ email: `otp-user-${randomUUID()}@example.com` });
      const otp = '654321';
      await harness.prisma.emailVerification.create({
        data: {
          email: otpUser.email,
          codeHash: await bcrypt.hash(otp, 10),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
      await expect(service.verifyEmailOtp(otpUser.email, '000000')).rejects.toThrow(UnauthorizedException);

      const orphanEmail = `otp-orphan-${randomUUID()}@example.com`;
      await harness.prisma.emailVerification.create({
        data: {
          email: orphanEmail,
          codeHash: await bcrypt.hash('123456', 10),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
      await expect(service.verifyEmailOtp(orphanEmail, '123456')).rejects.toThrow(UnauthorizedException);
    });

    it('marks OTP records as used and verifies the user when the code matches', async () => {
      const email = `otp-success-${randomUUID()}@example.com`;
      const user = await harness.registerUser({ email, isVerified: false, emailVerifiedAt: null });
      const otp = '789012';
      const record = await harness.prisma.emailVerification.create({
        data: {
          email,
          codeHash: await bcrypt.hash(otp, 10),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      await service.verifyEmailOtp(email, otp);

      const updatedUser = await harness.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(updatedUser.emailVerifiedAt).toBeInstanceOf(Date);

      const updatedRecord = await harness.prisma.emailVerification.findUnique({ where: { id: record.id } });
      expect(updatedRecord?.usedAt).toBeInstanceOf(Date);
    });
  });
});
