import request from 'supertest';
import { authenticator } from 'otplib';
import { TOTP_PORT } from '@cthub-bsaas/server-contracts-auth';
import { TotpOtplibAdapter } from '@cthub-bsaas/server-infrastructure';
import { setupAuthIntegrationHarness, AuthIntegrationHarness } from './utils/auth-integration.harness';
import { UserRole } from '@cthub-bsaas/shared';

describe('AuthController (Integration) - error responses', () => {
  let harness: AuthIntegrationHarness;

  const formatCookieHeader = (cookies: string[]): string => cookies.map((cookie) => cookie.split(';')[0]).join('; ');

  beforeEach(async () => {
    harness = await setupAuthIntegrationHarness();
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
        .withAuth(request(harness.app.getHttpServer()).post('/auth/sessions/revoke'), adminCookies)
        .send({ id: staffSession.id })
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
    });

    describe('staff', () => {
      it('rejects staff invite validation for unknown token', async () => {
        await request(harness.app.getHttpServer())
          .get('/auth/staff/registration/not-a-token')
          .expect(400);
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
        .post('/auth/sessions/revoke')
        .set('Cookie', formatCookieHeader(cookies))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ id: sessionId })
        .expect(403);
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

    it('rejects invalid credentials during login', async () => {
      const user = await harness.registerUser();

      await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'wrong-password' })
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
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/verify'), initialCookies)
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
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/verify'), cookies)
        .send({ token: '000000' })
        .expect(401);
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
  });
});
