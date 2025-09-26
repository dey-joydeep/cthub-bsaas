import request from 'supertest';
import { authenticator } from 'otplib';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { RegistrationStatus } from '@prisma/client';
import { UserRole } from '@cthub-bsaas/shared';
import { TOTP_PORT, WEB_AUTHN_PORT } from '@cthub-bsaas/server-contracts-auth';
import { TotpOtplibAdapter, WebAuthnStubAdapter } from '@cthub-bsaas/server-infrastructure';
import { ConfigService, IS_PUBLIC_KEY } from '@cthub-bsaas/server-core';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import { setupAuthIntegrationHarness, AuthIntegrationHarness, ensureAuthRoles } from './utils/auth-integration.harness';

import 'reflect-metadata';

describe('AuthController (Integration) - success flows', () => {
  let harness: AuthIntegrationHarness;
  let configService: ConfigService;
  const cleanupTasks: Array<() => Promise<void>> = [];

  const decryptTotpSecret = async (userId: string): Promise<string> => {
    const record = await harness.prisma.credentialTOTP.findUnique({ where: { userId } });
    expect(record).toBeTruthy();
    if (!record) {
      throw new Error('TOTP credential missing');
    }
    const encrypted = Buffer.from(record.secretEncrypted).toString();
    return harness.encryptionService.decrypt(encrypted);
  };

  const setRoutePublicFlag = (method: string, value: boolean | undefined): void => {
    const target = AuthController.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(target, method);
    if (typeof value === 'undefined') {
      Reflect.deleteMetadata(IS_PUBLIC_KEY, target, method);
      if (descriptor?.value) {
        Reflect.deleteMetadata(IS_PUBLIC_KEY, descriptor.value);
      }
    } else {
      Reflect.defineMetadata(IS_PUBLIC_KEY, value, target, method);
      if (descriptor?.value) {
        Reflect.defineMetadata(IS_PUBLIC_KEY, value, descriptor.value);
      }
    }
  };

  const getRoutePublicFlag = (method: string): boolean | undefined => {
    const target = AuthController.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(target, method);
    return (
      Reflect.getMetadata(IS_PUBLIC_KEY, target, method) ??
      (descriptor?.value ? Reflect.getMetadata(IS_PUBLIC_KEY, descriptor.value) : undefined)
    );
  };

  beforeEach(async () => {
    harness = await setupAuthIntegrationHarness();
    configService = harness.app.get(ConfigService);
    await harness.resetThrottle();
  });

  afterEach(async () => {
    while (cleanupTasks.length) {
      const task = cleanupTasks.pop();
      if (task) {
        await task();
      }
    }
    if (!harness) {
      return;
    }
    harness.resetEmails();
    await harness.cleanupUsers();
    await harness.resetThrottle();
    await harness.close();
    // Allow GC to reclaim the Nest app between cases and avoid reusing stale references.
    harness = undefined as unknown as AuthIntegrationHarness;
  });

  const loginRequest = (email: string, password: string) =>
    request(harness.app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

  const computeProviderUserId = (code: string) => `dev_${createHash('sha256').update(code).digest('hex').slice(0, 12)}`;
  const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

  const createSalonFixture = async () => {
    const suffix = randomUUID().replace(/-/g, '');
    const isoBase = suffix.toUpperCase();
    const iso2 = (isoBase + 'XX').slice(0, 2);
    const iso3 = (isoBase + 'XXX').slice(0, 3);

    const country = await harness.prisma.country.create({
      data: {
        id: randomUUID(),
        name: `Test Country ${suffix}`,
        iso2,
        iso3,
      },
    });

    const state = await harness.prisma.state.create({
      data: {
        id: randomUUID(),
        name: `Test State ${suffix}`,
        stateCode: (isoBase + 'ST').slice(0, 3),
        countryId: country.id,
      },
    });

    const city = await harness.prisma.city.create({
      data: {
        id: randomUUID(),
        name: `Test City ${suffix}`,
        stateId: state.id,
        countryId: country.id,
      },
    });

    const tenantAddress = await harness.prisma.businessAddress.create({
      data: {
        id: randomUUID(),
        countryId: country.id,
        stateId: state.id,
        cityId: city.id,
        postalCode: '00000',
        line1: '123 Tenant St',
      },
    });

    const salonAddress = await harness.prisma.businessAddress.create({
      data: {
        id: randomUUID(),
        countryId: country.id,
        stateId: state.id,
        cityId: city.id,
        postalCode: '00000',
        line1: '456 Salon St',
      },
    });

    const tenant = await harness.prisma.salonTenant.create({
      data: {
        id: randomUUID(),
        name: `Tenant ${suffix}`,
        email: `tenant-${suffix}@example.com`,
        businessAddressId: tenantAddress.id,
      },
    });

    const ownerEmail = `owner-${suffix}@example.com`;
    const owner = await harness.registerUser({
      roles: [UserRole.OWNER],
      email: ownerEmail,
      registrationStatus: RegistrationStatus.COMPLETED,
    });

    const salon = await harness.prisma.salon.create({
      data: {
        id: randomUUID(),
        tenantId: tenant.id,
        businessAddressId: salonAddress.id,
        ownerId: owner.id,
        name: `Salon ${suffix}`,
        slug: `salon-${suffix}`,
        phone: '+1234567000',
        email: `salon-${suffix}@example.com`,
      },
    });

    cleanupTasks.push(async () => {
      await harness.prisma.registrationLink.deleteMany({ where: { salonId: salon.id } });
      await harness.prisma.staffInvite.deleteMany({ where: { salonId: salon.id } });
      await harness.prisma.salon.deleteMany({ where: { id: salon.id } });
      await harness.prisma.salonTenant.deleteMany({ where: { id: tenant.id } });
      await harness.prisma.businessAddress.deleteMany({ where: { id: { in: [tenantAddress.id, salonAddress.id] } } });
      await harness.prisma.city.deleteMany({ where: { id: city.id } });
      await harness.prisma.state.deleteMany({ where: { id: state.id } });
      await harness.prisma.country.deleteMany({ where: { id: country.id } });
    });

    return {
      salonId: salon.id,
      ownerUserId: owner.id,
      ownerEmail,
    };
  };

  const createOwnerInvite = async (options: { requireMfa?: boolean } = {}) => {
    const fixture = await createSalonFixture();
    if (options.requireMfa) {
      await harness.prisma.user.update({
        where: { id: fixture.ownerUserId },
        data: { isMFAEnrollRequired: true },
      });
    }
    const token = `owner-${randomUUID()}`;
    await harness.prisma.registrationLink.create({
      data: {
        tokenHash: hashToken(token),
        email: fixture.ownerEmail,
        salonId: fixture.salonId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    return { token, email: fixture.ownerEmail, salonId: fixture.salonId };
  };

  const createStaffInvite = async (options: { requireMfa?: boolean } = {}) => {
    const fixture = await createSalonFixture();
    const staff = await harness.registerUser({
      roles: [UserRole.STAFF],
      email: `staff-${randomUUID()}@example.com`,
      registrationStatus: RegistrationStatus.COMPLETED,
    });
    if (options.requireMfa) {
      await harness.prisma.user.update({
        where: { id: staff.id },
        data: { isMFAEnrollRequired: true },
      });
    }
    const token = `staff-${randomUUID()}`;
    await harness.prisma.staffInvite.create({
      data: {
        tokenHash: hashToken(token),
        email: staff.email,
        salonId: fixture.salonId,
        role: 'MANAGER',
        tempPasswordHash: await bcrypt.hash('Temp#123', 10),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    return { token, email: staff.email, salonId: fixture.salonId };
  };

  describe('admin', () => {
    it('issues admin JWTs with admin role claim', async () => {
      const admin = await harness.registerUser({ roles: [UserRole.ADMIN] });

      const loginRes = await loginRequest(admin.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const accessToken = harness.extractCookieValue(cookies, 'bsaas_at');
      expect(accessToken).toBeDefined();

      const payload = await harness.jwtService.verifyAsync(accessToken!, {
        secret: configService.auth.jwtAccessSecret,
      });
      expect(Array.isArray(payload.roles)).toBe(true);
      expect(payload.roles).toContain('ADMIN');
    });

    it('enforces TOTP challenge for admin sessions once verified', async () => {
      const admin = await harness.registerUser({ roles: [UserRole.ADMIN] });
      const totpAdapter = harness.app.get<TotpOtplibAdapter>(TOTP_PORT);
      await totpAdapter.generateSecret(admin.id);

      const firstLogin = await loginRequest(admin.email, 'password').expect(200);
      const firstCookies = harness.expectCookies(harness.toCookiesArray(firstLogin.headers['set-cookie']), { requireAuth: true });

      const secret = await decryptTotpSecret(admin.id);
      const setupCode = authenticator.generate(secret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/verify'), firstCookies)
        .send({ token: setupCode })
        .expect(200);

      const challengeLogin = await loginRequest(admin.email, 'password').expect(200);
      expect(challengeLogin.body.data.totpRequired).toBe(true);
      const tempToken = challengeLogin.body.data.tempToken as string;
      const challengeCookies = harness.expectCookies(harness.toCookiesArray(challengeLogin.headers['set-cookie']));

      const challengeCode = authenticator.generate(secret);
      const totpRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/login/totp'), challengeCookies)
        .send({ tempToken, totpCode: challengeCode })
        .expect(200);
      expect(totpRes.body).toEqual({ success: true, data: {} });

      const finalCookies = harness.expectCookies(harness.toCookiesArray(totpRes.headers['set-cookie']), { requireAuth: true });
      const adminAccessToken = harness.extractCookieValue(finalCookies, 'bsaas_at');
      expect(adminAccessToken).toBeDefined();
      const payload = await harness.jwtService.verifyAsync(adminAccessToken!, {
        secret: configService.auth.jwtAccessSecret,
      });
      expect(payload.roles).toContain('ADMIN');
    });
  });

  describe('partner', () => {
    describe('owner', () => {
      it('validates owner invite and completes registration with active session', async () => {
        const { token, email, salonId } = await createOwnerInvite();

        const validateRes = await request(harness.app.getHttpServer())
          .get(`/auth/owner/registration/${token}`)
          .expect(200);
        expect(validateRes.body.data).toEqual({ valid: true, email, salonId });

        const completeRes = await request(harness.app.getHttpServer())
          .post('/auth/owner/registration/complete')
          .send({ token, password: 'Password#1' })
          .expect(201);
        const ownerCookies = harness.expectCookies(
          harness.toCookiesArray(completeRes.headers['set-cookie']),
          { requireAuth: true },
        );
        expect(ownerCookies.length).toBeGreaterThan(0);
        expect(completeRes.body.data).toEqual({});
      });

      it('signals MFA requirement when owner registration needs additional verification', async () => {
        const { token } = await createOwnerInvite({ requireMfa: true });

        const mfaRes = await request(harness.app.getHttpServer())
          .post('/auth/owner/registration/complete')
          .send({ token, password: 'Password#1', totpCode: '123456' })
          .expect(201);
        expect(mfaRes.body.data).toEqual({ next: 'mfa' });
        expect(mfaRes.headers['set-cookie']).toBeUndefined();
      });
    });

    describe('staff', () => {
      it('validates staff invite and completes registration with issued session', async () => {
        const { token, email, salonId } = await createStaffInvite();

        const validateRes = await request(harness.app.getHttpServer())
          .get(`/auth/staff/registration/${token}`)
          .expect(200);
        expect(validateRes.body.data).toEqual({ valid: true, email, salonId });

        const completeRes = await request(harness.app.getHttpServer())
          .post('/auth/staff/registration/complete')
          .send({ token, password: 'Password#1' })
          .expect(201);
        const staffCookies = harness.expectCookies(
          harness.toCookiesArray(completeRes.headers['set-cookie']),
          { requireAuth: true },
        );
        expect(staffCookies.length).toBeGreaterThan(0);
        expect(completeRes.body.data).toEqual({});
      });

      it('deferred staff registration responds with MFA directive', async () => {
        const { token } = await createStaffInvite({ requireMfa: true });

        const res = await request(harness.app.getHttpServer())
          .post('/auth/staff/registration/complete')
          .send({ token, password: 'Password#1', totpCode: '654321' })
          .expect(201);
        expect(res.body.data).toEqual({ next: 'mfa' });
        expect(res.headers['set-cookie']).toBeUndefined();
      });
    });
  });

  describe('customer', () => {
    it('performs login, refresh rotation, session lifecycle, and logout', async () => {
      const user = await harness.registerUser();

      const loginRes = await loginRequest(user.email, 'password').expect(200);
      expect(loginRes.body.data.totpRequired).toBe(false);
      const loginCookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const loginRefreshToken = harness.extractCookieValue(loginCookies, 'bsaas_rt');
      expect(loginRefreshToken).toBeDefined();

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/refresh'), loginCookies)
        .send({ refreshToken: loginRefreshToken })
        .expect(200);

      const sessionsRes = await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/sessions'), loginCookies)
        .expect(200);
      const sessionId: string = sessionsRes.body.data[0].id;

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/sessions/revoke'), loginCookies)
        .send({ id: sessionId })
        .expect(200);

      // Clearing throttle counters models elapsed time between customer login attempts while keeping the real guard active.
      await harness.resetThrottle();

      const loginResTwo = await loginRequest(user.email, 'password').expect(200);
      const cookiesTwo = harness.expectCookies(harness.toCookiesArray(loginResTwo.headers['set-cookie']), { requireAuth: true });
      const sessionsResTwo = await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/sessions'), cookiesTwo)
        .expect(200);
      const sessionIdTwo: string = sessionsResTwo.body.data[0].id;

      await harness
        .withAuth(request(harness.app.getHttpServer()).post(`/auth/sessions/revoke/${sessionIdTwo}`), cookiesTwo)
        .expect(200);

      await harness.resetThrottle();

      const loginResThree = await loginRequest(user.email, 'password').expect(200);
      const cookiesThree = harness.expectCookies(harness.toCookiesArray(loginResThree.headers['set-cookie']), { requireAuth: true });
      const sessionsResThree = await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/sessions'), cookiesThree)
        .expect(200);
      await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/devices'), cookiesThree)
        .expect(200);

      const sessionIdThree: string = sessionsResThree.body.data[0].id;

      await harness
        .withAuth(request(harness.app.getHttpServer()).delete(`/auth/sessions/${sessionIdThree}`), cookiesThree)
        .expect(200);

      const loginResFour = await loginRequest(user.email, 'password').expect(200);
      const cookiesFour = harness.expectCookies(harness.toCookiesArray(loginResFour.headers['set-cookie']), { requireAuth: true });
      const sessionsResFour = await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/sessions'), cookiesFour)
        .expect(200);
      const sessionIdFour: string = sessionsResFour.body.data[0].id;

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/devices/revoke'), cookiesFour)
        .send({ id: sessionIdFour })
        .expect(200);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/logout'), cookiesFour)
        .expect(200);
    });

    it('re-seeds auth roles when role table is empty', async () => {
      await harness.prisma.$transaction(async (trx) => {
        await trx.$executeRawUnsafe('LOCK TABLE "role" IN EXCLUSIVE MODE');
        await trx.userRole.deleteMany();
        await trx.role.deleteMany();
        // Manually invoke the shared seeder to mimic the bootstrap path without racing other workers.
        await ensureAuthRoles(trx, [UserRole.CUSTOMER]);
      });

      const roles = await harness.prisma.role.findMany({ orderBy: { name: 'asc' } });
      expect(roles.map((role) => role.name)).toEqual(['CUSTOMER']);
    });

    it('throttles repeated login attempts', async () => {
      const user = await harness.registerUser();
      const agent = request(harness.app.getHttpServer());

      for (let i = 0; i < 5; i += 1) {
        await agent
          .post('/auth/login')
          .send({ email: user.email, password: 'wrong-password' })
          .expect(401);
      }

      await agent
        .post('/auth/login')
        .send({ email: user.email, password: 'wrong-password' })
        .expect(429);
    });

    it('completes TOTP challenge flow', async () => {
      const user = await harness.registerUser();
      const totpAdapter = harness.app.get<TotpOtplibAdapter>(TOTP_PORT);
      const { secret } = await totpAdapter.generateSecret(user.id);

      const initialLoginRes = await loginRequest(user.email, 'password').expect(200);
      const initialCookies = harness.expectCookies(harness.toCookiesArray(initialLoginRes.headers['set-cookie']), {
        requireAuth: true,
      });

      const verificationCode = authenticator.generate(secret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/verify'), initialCookies)
        .send({ token: verificationCode })
        .expect(200);

      const challengeLoginRes = await loginRequest(user.email, 'password').expect(200);
      expect(challengeLoginRes.body.data.totpRequired).toBe(true);
      const tempToken = challengeLoginRes.body.data.tempToken as string;
      const totpCookies = harness.expectCookies(harness.toCookiesArray(challengeLoginRes.headers['set-cookie']));
      const totpCsrf = harness.extractCookieValue(totpCookies, 'XSRF-TOKEN');
      expect(totpCsrf).toBeDefined();

      const challengeCode = authenticator.generate(secret);
      const totpResponse = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/login/totp'), totpCookies)
        .send({ tempToken, totpCode: challengeCode })
        .expect(200);
      expect(totpResponse.body).toEqual({ success: true, data: {} });

      const credential = await harness.prisma.credentialTOTP.findUnique({ where: { userId: user.id } });
      expect(credential?.verified).toBe(true);
      expect(credential?.secretEncrypted.length ?? 0).toBeGreaterThan(0);
    });

    it('enrolls TOTP via controller endpoints', async () => {
      const user = await harness.registerUser();
      const loginRes = await loginRequest(user.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      const setupRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/setup'), cookies)
        .expect(200);
      expect(setupRes.body.qrCodeDataUrl).toBeDefined();
      const setupSecret = await decryptTotpSecret(user.id);

      const setupToken = authenticator.generate(setupSecret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/verify'), cookies)
        .send({ token: setupToken })
        .expect(200);

      const enrollStartRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/start'), cookies)
        .expect(200);
      expect(enrollStartRes.body.qrCodeDataUrl).toBeDefined();
      const enrollSecret = await decryptTotpSecret(user.id);

      const enrollToken = authenticator.generate(enrollSecret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), cookies)
        .send({ token: enrollToken })
        .expect(200);
    });

    it('issues and verifies recovery codes', async () => {
      const user = await harness.registerUser();
      const loginRes = await loginRequest(user.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      const generateRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery/generate'), cookies)
        .expect(200);
      expect(Array.isArray(generateRes.body.data)).toBe(true);
      expect(generateRes.body.data).toHaveLength(10);

      const generateAliasRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery/codes'), cookies)
        .expect(200);
      expect(Array.isArray(generateAliasRes.body.data)).toBe(true);
      expect(generateAliasRes.body.data).toHaveLength(10);

      const recoveryRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery-codes/issue'), cookies)
        .expect(201);

      const codes: string[] = recoveryRes.body.data;
      expect(Array.isArray(codes)).toBe(true);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery/verify'), cookies)
        .send({ code: codes[0] })
        .expect(200);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery-codes/verify'), cookies)
        .send({ code: codes[1] })
        .expect(200);
    });

    it('handles password reset and change lifecycle', async () => {
      const user = await harness.registerUser();

      await request(harness.app.getHttpServer())
        .post('/auth/password/forgot')
        .send({ email: user.email })
        .expect(202);

      const resetEmail = harness.sentEmails.find((mail) => mail.subject.includes('Password Reset')) ?? harness.sentEmails[0];
      const resetToken = resetEmail?.body.split(': ').pop()?.trim();
      expect(resetToken).toBeDefined();

      await request(harness.app.getHttpServer())
        .post('/auth/password/reset')
        .send({ token: resetToken, newPassword: 'NewPassword#1' })
        .expect(200);

      await harness.resetThrottle();

      const loginRes = await loginRequest(user.email, 'NewPassword#1').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/password/change'), cookies)
        .send({ currentPassword: 'NewPassword#1', newPassword: 'NewPassword#2' })
        .expect(200);
    });

    it('requests and confirms email change', async () => {
      const user = await harness.registerUser();
      const loginRes = await loginRequest(user.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const newEmail = `updated-${randomUUID()}@example.com`;

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/email/change/request'), cookies)
        .send({ newEmail })
        .expect(202);

      const changeEmail = harness.sentEmails.find((mail) => mail.subject.includes('Confirm your new email address'));
      const changeToken = changeEmail?.body.split(': ').pop()?.trim();
      expect(changeToken).toBeDefined();

      await request(harness.app.getHttpServer())
        .post('/auth/email/change/confirm')
        .send({ token: changeToken })
        .expect(200);

      const updated = await harness.prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.email).toBe(newEmail);
    });

    it('verifies email using OTP and token branches', async () => {
      const user = await harness.registerUser({ email: `verify-${randomUUID()}@example.com`, emailVerifiedAt: null, isVerified: false });

      await request(harness.app.getHttpServer())
        .post('/auth/email/send-verification')
        .send({ email: user.email })
        .expect(202);

      const otpEmail = harness.sentEmails.find((mail) => mail.subject.includes('Verify your email')) ?? harness.sentEmails[0];
      const otpMatch = otpEmail.body.match(/code is: (\d{6})/);
      const otp = otpMatch?.[1];
      expect(otp).toBeDefined();

      await request(harness.app.getHttpServer())
        .post('/auth/email/verify/confirm')
        .send({ email: user.email, otp })
        .expect(200);

      const verifyToken = await harness.jwtService.signAsync(
        { sub: user.id, aud: 'verify' },
        { secret: configService.auth.jwtVerifyEmailSecret },
      );

      const aliasConfirmRes = await request(harness.app.getHttpServer())
        .post('/auth/email/verify/confirm')
        .send({ token: verifyToken })
        .expect(200);
      expect(aliasConfirmRes.body.data).toEqual({ success: true });

      const directToken = await harness.jwtService.signAsync(
        { sub: user.id, aud: 'verify' },
        { secret: configService.auth.jwtVerifyEmailSecret },
      );

      await request(harness.app.getHttpServer())
        .post('/auth/email/verify')
        .send({ token: directToken })
        .expect(200);
    });

    it('starts OAuth login by redirecting to provider', async () => {
      const startRes = await request(harness.app.getHttpServer())
        .get('/auth/oauth/google/start')
        .expect(302);

      expect(startRes.headers.location).toBeDefined();
    });

    it('completes OAuth sign-in, link, and unlink flows', async () => {
      const user = await harness.registerUser();
      const originalFlag = getRoutePublicFlag('oauthCallback');

      try {
        // Allow public access for the sign-in scenario
        setRoutePublicFlag('oauthCallback', true);
        const signInCode = 'oauth-sign-in-code';
        await harness.prisma.socialAccount.create({
          data: { userId: user.id, provider: 'google', providerUserId: computeProviderUserId(signInCode) },
        });

        await request(harness.app.getHttpServer())
          .get(`/auth/oauth/google/callback?code=${signInCode}`)
          .expect(200);

        const loginRes = await loginRequest(user.email, 'password').expect(200);
        const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

        // Require authentication for the link scenario
        setRoutePublicFlag('oauthCallback', false);
        const linkCode = 'oauth-link-code';
        await harness
          .withAuth(request(harness.app.getHttpServer()).get(`/auth/oauth/google/callback?code=${linkCode}`), cookies)
          .expect(200);

        const linkedAccount = await harness.prisma.socialAccount.findFirst({
          where: { userId: user.id, providerUserId: computeProviderUserId(linkCode) },
        });
        expect(linkedAccount).toBeTruthy();

        await harness
          .withAuth(request(harness.app.getHttpServer()).post('/auth/oauth/google/unlink'), cookies)
          .expect(200);

        await harness.prisma.socialAccount.create({
          data: { userId: user.id, provider: 'google', providerUserId: computeProviderUserId('unlink-delete') },
        });

        await harness
          .withAuth(request(harness.app.getHttpServer()).delete('/auth/oauth/google'), cookies)
          .expect(200);
      } finally {
        setRoutePublicFlag('oauthCallback', originalFlag);
      }
    });

    it('registers a new customer account', async () => {
      const email = `register-${randomUUID()}@example.com`;
      await request(harness.app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'Password#1', name: 'Customer Register' })
        .expect(201);

      const created = await harness.prisma.user.findUnique({ where: { email } });
      expect(created).toBeTruthy();
      if (created) {
        harness.trackUser(created.id);
      }
    });

    it('handles webauthn start and finish flows', async () => {
      const user = await harness.registerUser();
      const loginRes = await loginRequest(user.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      const registerStartRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/webauthn/register/start'), cookies)
        .send({ username: 'Test Device' })
        .expect(200);
      expect(registerStartRes.body.success).toBe(true);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/webauthn/register/finish'), cookies)
        .send({ response: {} })
        .expect(200);

      const loginStartRes = await request(harness.app.getHttpServer())
        .post('/auth/webauthn/login/start')
        .send({ email: user.email })
        .expect(200);
      expect(loginStartRes.body.success).toBe(true);

      const originalFinishFlag = getRoutePublicFlag('webauthnLoginFinish');
      try {
        setRoutePublicFlag('webauthnLoginFinish', false);
        const loginFinishRes = await harness
          .withAuth(request(harness.app.getHttpServer()).post('/auth/webauthn/login/finish'), cookies)
          .send({ response: {} })
          .expect(200);
        expect(loginFinishRes.body.data).toEqual({});
      } finally {
        setRoutePublicFlag('webauthnLoginFinish', originalFinishFlag);
      }

      const webAuthnAdapter = harness.app.get<WebAuthnStubAdapter>(WEB_AUTHN_PORT);
      expect(webAuthnAdapter).toBeDefined();
    });

    it('requests email verification via alias endpoint', async () => {
      const user = await harness.registerUser({ email: `verify-request-${randomUUID()}@example.com`, emailVerifiedAt: null, isVerified: false });

      await request(harness.app.getHttpServer())
        .post('/auth/email/verify/request')
        .send({ email: user.email })
        .expect(202);

      const otpEmail = harness.sentEmails.find((mail) => mail.subject.includes('Verify your email'));
      expect(otpEmail).toBeDefined();
    });
  });
});
