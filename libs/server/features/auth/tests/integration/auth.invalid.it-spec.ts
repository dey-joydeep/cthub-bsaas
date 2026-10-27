import request from 'supertest';
import { randomUUID } from 'crypto';
import { authenticator } from 'otplib';
import { setupAuthIntegrationHarness, AuthIntegrationHarness } from './utils/auth-integration.harness';
import { TOTP_PORT } from '@cthub-bsaas/server-contracts-auth';
import { TotpOtplibAdapter } from '@cthub-bsaas/server-infrastructure';
import { UserRole } from '@cthub-bsaas/shared';

describe('AuthController (Integration) - validation failures', () => {
  let harness: AuthIntegrationHarness;

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
    it('rejects admin TOTP login payload without required fields', async () => {
      const admin = await harness.registerUser({ roles: [UserRole.ADMIN] });
      const totpAdapter = harness.app.get<TotpOtplibAdapter>(TOTP_PORT);
      await totpAdapter.generateSecret(admin.id);

      const initialLogin = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: admin.email, password: 'password' })
        .expect(200);
      const initialCookies = harness.expectCookies(harness.toCookiesArray(initialLogin.headers['set-cookie']), { requireAuth: true });

      const secret = await harness.prisma.credentialTOTP.findUnique({ where: { userId: admin.id } });
      expect(secret).toBeTruthy();
      const totpSecret = harness.encryptionService.decrypt(Buffer.from(secret!.secretEncrypted).toString());
      const verificationCode = authenticator.generate(totpSecret);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), initialCookies)
        .send({ token: verificationCode })
        .expect(200);

      const challengeLogin = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: admin.email, password: 'password' })
        .expect(200);
      expect(challengeLogin.body.data.totpRequired).toBe(true);
      const challengeCookies = harness.expectCookies(harness.toCookiesArray(challengeLogin.headers['set-cookie']));

      await harness.withAuth(request(harness.app.getHttpServer()).post('/auth/login/totp'), challengeCookies).send({}).expect(400);
    });
  });

  describe('partner', () => {
    describe('owner', () => {
      it('rejects owner registration completion without password', async () => {
        await request(harness.app.getHttpServer()).post('/auth/owner/registration/complete').send({ token: 'placeholder' }).expect(400);
      });
    });

    describe('staff', () => {
      it('rejects staff registration completion without password', async () => {
        await request(harness.app.getHttpServer()).post('/auth/staff/registration/complete').send({ token: 'placeholder' }).expect(400);
      });
    });
  });

  describe('customer', () => {
    // Run the TOTP-specific validation first so other login-heavy specs do not accumulate throttle hits.
    it('rejects TOTP verification payload without required fields', async () => {
      const user = await harness.registerUser({ email: `totp-invalid-${randomUUID()}@example.com` });
      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']));

      await harness.withAuth(request(harness.app.getHttpServer()).post('/auth/login/totp'), cookies).send({}).expect(400);
    });

    it('rejects login payload missing required fields', async () => {
      await request(harness.app.getHttpServer()).post('/auth/login').send({ email: 'not-an-email' }).expect(400);
    });

    it('rejects password change request with invalid body', async () => {
      const user = await harness.registerUser({ email: `invalid-${randomUUID()}@example.com` });

      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']));

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/password/change'), cookies)
        .send({ currentPassword: 'password' })
        .expect(400);
    });

    it('rejects email change request with malformed email', async () => {
      const user = await harness.registerUser({ email: `invalid-email-${randomUUID()}@example.com` });

      const loginRes = await request(harness.app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' })
        .expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']));

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/email/change/request'), cookies)
        .send({ newEmail: 'not-an-email' })
        .expect(400);
    });

    it('rejects email verification confirmation without identifying payload', async () => {
      await request(harness.app.getHttpServer()).post('/auth/email/verify/confirm').send({}).expect(400);
    });

    it('rejects webauthn login start when payload is omitted', async () => {
      await request(harness.app.getHttpServer()).post('/auth/webauthn/login/start').expect(400);
    });

    it('rejects webauthn login start when no identity is provided', async () => {
      await request(harness.app.getHttpServer()).post('/auth/webauthn/login/start').send({}).expect(400);
    });
  });
});
