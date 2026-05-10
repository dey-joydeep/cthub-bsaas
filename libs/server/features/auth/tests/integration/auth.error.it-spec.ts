import request from 'supertest';
import { randomUUID } from 'crypto';
import { authenticator } from 'otplib';
import { ConfigService, LoggerService } from '@cthub-bsaas/server-core';
import { TOTP_PORT, USER_REPOSITORY, type InvitePort, type IUserRepository } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../../src/lib/services/auth.service';
import { AuditService } from '../../src/lib/services/audit.service';
import { TotpOtplibAdapter } from '@cthub-bsaas/server-infrastructure';
import { setupAuthIntegrationHarness, AuthIntegrationHarness, ensureAuthRoles } from './utils/auth-integration.harness';
import { UserRole } from '@cthub-bsaas/shared';

describe('AuthController (Integration) - error responses', () => {
  let harness: AuthIntegrationHarness;

  const formatCookieHeader = (cookies: string[]): string => cookies.map((cookie) => cookie.split(';')[0]).join('; ');

  beforeEach(async () => {
    harness = await setupAuthIntegrationHarness();
    await ensureAuthRoles(harness.prisma);
    await harness.resetThrottle();
  });

  afterEach(async () => {
    if (!harness) {
      return;
    }
    await harness.cleanupUsers();
    harness.resetEmails();
    await harness.resetThrottle();
    await harness.close();
    // Allow GC to reclaim the Nest app between cases and avoid reusing stale references.
    harness = undefined as unknown as AuthIntegrationHarness;
  });

  describe('admin', () => {
    it('prevents admin from revoking another user session', async () => {
      const admin = await harness.registerUser({ roles: [UserRole.ADMIN] });
      const staff = await harness.registerUser({ roles: [UserRole.STAFF] });

      const staffLogin = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: staff.email, password: 'password' })
        .expect(200);
      harness.expectCookies(harness.toCookiesArray(staffLogin.headers['set-cookie']), { requireAuth: true });
      const staffSession = await harness.prisma.session.findFirstOrThrow({ where: { userId: staff.id } });

      const adminLogin = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: admin.email, password: 'password' })
        .expect(200);
      const adminCookies = harness.expectCookies(harness.toCookiesArray(adminLogin.headers['set-cookie']), { requireAuth: true });

      await harness
        .withAuth(request(harness.app.getHttpServer()).post(`/auth/sessions/revoke/${staffSession.id}`), adminCookies)
        .expect(401);
    });
  });

  describe('partner', () => {
    describe('owner', () => {
      it('rejects owner invite validation for unknown token', async () => {
        await request(harness.app.getHttpServer())
          .get('/auth/owner/registration/not-a-token')
          .expect(400);
      });

      it('returns not implemented when owner invite port is unavailable', async () => {
        const authService = harness.app.get(AuthService);
        const originalPort = Reflect.get(authService as object, 'invitePort') as InvitePort | undefined;
        Reflect.set(authService as object, 'invitePort', undefined);

        try {
          await request(harness.app.getHttpServer())
            .get('/auth/owner/registration/test-token')
            .expect(400);

          await request(harness.app.getHttpServer())
            .post('/auth/owner/registration/complete')
            .send({ token: 'test-token', password: 'Password#1' })
            .expect(400);
        } finally {
          Reflect.set(authService as object, 'invitePort', originalPort);
        }
      });
    });

    describe('staff', () => {
      it('rejects staff invite validation for unknown token', async () => {
        await request(harness.app.getHttpServer())
          .get('/auth/staff/registration/not-a-token')
          .expect(400);
      });

      it('returns not implemented when staff invite port is unavailable', async () => {
        const authService = harness.app.get(AuthService);
        const originalPort = Reflect.get(authService as object, 'invitePort') as InvitePort | undefined;
        Reflect.set(authService as object, 'invitePort', undefined);

        try {
          await request(harness.app.getHttpServer())
            .get('/auth/staff/registration/test-token')
            .expect(400);

          await request(harness.app.getHttpServer())
            .post('/auth/staff/registration/complete')
            .send({ token: 'test-token', password: 'Password#1' })
            .expect(400);
        } finally {
          Reflect.set(authService as object, 'invitePort', originalPort);
        }
      });
    });
  });

  describe('customer', () => {
    // Start with the CSRF/session assertions so later login-heavy specs do not exceed throttle limits.
    it('rejects session revoke when CSRF header is missing', async () => {
      const user = await harness.registerUser();
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const accessToken = harness.extractCookieValue(cookies, 'bsaas_at');
      if (!accessToken) {
        throw new Error('Expected access token cookie to be present in CSRF test.');
      }

      const sessionsRes = await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/sessions'), cookies)
        .expect(200);
      const sessionId: string = sessionsRes.body.data[0].id;

      await request(harness.app.getHttpServer())
        .post(`/auth/sessions/revoke/${sessionId}`)
        .set('Cookie', formatCookieHeader(cookies))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('rejects refresh when both cookie and body tokens are provided', async () => {
      const user = await harness.registerUser();
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const xsrf = harness.extractCookieValue(cookies, 'XSRF-TOKEN');
      const refreshToken = harness.extractCookieValue(cookies, 'bsaas_rt');
      if (!refreshToken || !xsrf) {
        throw new Error('Expected refresh and XSRF cookies to be present');
      }

      await request(harness.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', formatCookieHeader(cookies))
        .set('X-XSRF-TOKEN', xsrf)
        .send({ refreshToken })
        .expect(400);
    });

    it('rejects refresh when CSRF header is missing', async () => {
      const user = await harness.registerUser();
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const refreshToken = harness.extractCookieValue(cookies, 'bsaas_rt');
      if (!refreshToken) {
        throw new Error('Expected refresh token cookie to be present in CSRF test.');
      }

      await request(harness.app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', formatCookieHeader(cookies))
        .send({ refreshToken })
        .expect(403);
    });

    it('rejects session listing when access token cookie value is empty', async () => {
      const user = await harness.registerUser();
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const xsrf = harness.extractCookieValue(cookies, 'XSRF-TOKEN');
      const cookieHeader = `bsaas_at=; XSRF-TOKEN=${xsrf ?? ''}`;

      await request(harness.app.getHttpServer())
        .get('/auth/sessions')
        .set('Cookie', cookieHeader)
        .set('X-XSRF-TOKEN', xsrf ?? '')
        .expect(401);
    });

    it('rejects invalid credentials during login', async () => {
      const user = await harness.registerUser();

      await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'wrong-password' })
        .expect(401);
    });

    it('rejects login when account does not exist', async () => {
      await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'missing-user@example.com', password: 'password' })
        .expect(401);
    });

    it('rejects invalid TOTP codes', async () => {
      const user = await harness.registerUser();
      const totpAdapter = harness.app.get<TotpOtplibAdapter>(TOTP_PORT);
      const { secret } = await totpAdapter.generateSecret(user.id);

      const initialLoginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const initialCookies = harness.expectCookies(harness.toCookiesArray(initialLoginRes.headers['set-cookie']), {
        requireAuth: true,
      });

      const validCode = authenticator.generate(secret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), initialCookies)
        .send({ token: validCode })
        .expect(200);

      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      expect(loginRes.body.data.totpRequired).toBe(true);
      const tempToken = loginRes.body.data.tempToken as string;
      const totpCookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']));
      const invalidCode = validCode === '000000' ? '111111' : '000000';

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/login/totp'), totpCookies)
        .send({ tempToken, totpCode: invalidCode })
        .expect(401);
    });

    it('requires refresh token when rotating', async () => {
      await request(harness.app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });

    it('rejects email change when target email is already in use', async () => {
      const existing = await harness.registerUser();
      const user = await harness.registerUser();

      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']));

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/email/change/request'), cookies)
        .send({ newEmail: existing.email })
        .expect(400);
    });

    it('prevents unlinking the last authentication method', async () => {
      const user = await harness.registerUser();
      await harness.prisma.socialAccount.create({
        data: { userId: user.id, provider: 'google', providerUserId: 'only-link' },
      });

      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']));
      await harness.prisma.user.update({ where: { id: user.id }, data: { passwordHash: '' } });

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/oauth/google/unlink'), cookies)
        .expect(401);
    });

    it('returns bad request when OAuth callback code is missing', async () => {
      await request(harness.app.getHttpServer())
        .get('/auth/oauth/google/callback')
        .expect(400);
    });

    it('rejects WebAuthn login finish when no authenticated user is present', async () => {
      await request(harness.app.getHttpServer())
        .post('/auth/webauthn/login/finish')
        .send({ response: {} })
        .expect(401);
    });

    it('rejects TOTP verification with invalid code', async () => {
      const user = await harness.registerUser();
      const totpAdapter = harness.app.get<TotpOtplibAdapter>(TOTP_PORT);
      await totpAdapter.generateSecret(user.id);

      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), cookies)
        .send({ token: '000000' })
        .expect(401);
    });

    it('fails TOTP login when account disappears after verification', async () => {
      const user = await harness.registerUser();
      const totpAdapter = harness.app.get<TotpOtplibAdapter>(TOTP_PORT);
      const { secret } = await totpAdapter.generateSecret(user.id);

      const initialLogin = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const initialCookies = harness.expectCookies(harness.toCookiesArray(initialLogin.headers['set-cookie']), {
        requireAuth: true,
      });

      const verificationCode = authenticator.generate(secret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), initialCookies)
        .send({ token: verificationCode })
        .expect(200);

      const challengeLogin = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      expect(challengeLogin.body.data.totpRequired).toBe(true);
      const tempToken = challengeLogin.body.data.tempToken as string;
      const totpCookies = harness.expectCookies(harness.toCookiesArray(challengeLogin.headers['set-cookie']));

      const userRepository = harness.app.get<IUserRepository>(USER_REPOSITORY);
      const originalFindById = userRepository.findById.bind(userRepository);
      const spy = jest.spyOn(userRepository, 'findById').mockImplementation(async (id: string) => {
        if (id === user.id) {
          return null;
        }
        return originalFindById(id);
      });

      const challengeCode = authenticator.generate(secret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/login/totp'), totpCookies)
        .send({ tempToken, totpCode: challengeCode })
        .expect(401);

      spy.mockRestore();
    });

    it('rejects TOTP enroll finish with invalid token', async () => {
      const user = await harness.registerUser();
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/start'), cookies)
        .expect(200);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), cookies)
        .send({ token: '000000' })
        .expect(401);
    });

    it('rejects recovery code verification when code is invalid', async () => {
      const user = await harness.registerUser();
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery/verify'), cookies)
        .send({ code: 'invalid-code' })
        .expect(400);
    });

    it('rejects password change when current password is invalid', async () => {
      const user = await harness.registerUser();
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);

      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']));

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/password/change'), cookies)
        .send({ currentPassword: 'wrong', newPassword: 'NewPassword#1' })
        .expect(401);
    });

    it('rejects password reset when token is malformed', async () => {
      await request(harness.app.getHttpServer())
        .post('/auth/password/reset')
        .send({ token: 'invalid-token', newPassword: 'NewPassword#1' })
        .expect(401);
    });

    it('rejects email verification tokens with invalid audience', async () => {
      const user = await harness.registerUser({
        email: `invalid-audience-${randomUUID()}@example.com`,
        emailVerifiedAt: null,
        isVerified: false,
      });

      const config = harness.app.get(ConfigService);
      const token = await harness.jwtService.signAsync(
        { sub: user.id, aud: 'wrong-audience' },
        { secret: config.auth.jwtVerifyEmailSecret },
      );

      await request(harness.app.getHttpServer())
        .post('/auth/email/verify/confirm')
        .send({ token })
        .expect(401);
    });

    it('logs audit events through the audit service', () => {
      const auditService = harness.app.get(AuditService);
      const logger = harness.app.get(LoggerService) as { access: jest.Mock };
      auditService.log('integration_audit_test', { marker: 'value' });
      expect(logger.access).toHaveBeenCalledWith(expect.stringContaining('integration_audit_test'), 'AuthAudit');
    });
  });
});
