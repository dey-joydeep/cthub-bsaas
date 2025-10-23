import request from 'supertest';
import { authenticator } from 'otplib';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { RegistrationStatus } from '@prisma/client';
import { UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';
import {
  TOTP_PORT,
  WEB_AUTHN_PORT,
  type RecoveryCodesPort,
  type OAuthPort,
  type WebAuthnPort,
  type RegistrationCompleteInput,
} from '@cthub-bsaas/server-contracts-auth';
import { TotpOtplibAdapter } from '@cthub-bsaas/server-infrastructure';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthCookiesService } from '../../src/lib/services/auth-cookies.service';
import { AuthService } from '../../src/lib/services/auth.service';
import { ContextIdFactory, type ContextId } from '@nestjs/core';
import { ConfigService, IS_PUBLIC_KEY, CookieRegistry } from '@cthub-bsaas/server-core';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import type { Request as ExpressRequest } from 'express';
import { LoginDto } from '../../src/lib/dto/login.dto';
import { RefreshTokenDto } from '../../src/lib/dto/refresh-token.dto';
import { WebauthnAssertionDto } from '../../src/lib/dto/webauthn-assertion.dto';
import type { AuthSignInResult, JwtUserContext } from '../../src/lib/types/auth.types';
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
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), firstCookies)
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
        .send({})
        .expect(200);

      const sessionsRes = await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/sessions'), loginCookies)
        .expect(200);
      const sessionId: string = sessionsRes.body.data[0].id;

      await harness
        .withAuth(request(harness.app.getHttpServer()).post(`/auth/sessions/revoke/${sessionId}`), loginCookies)
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
      const sessionIdThree: string = sessionsResThree.body.data[0].id;

      await harness
        .withAuth(request(harness.app.getHttpServer()).post(`/auth/sessions/revoke/${sessionIdThree}`), cookiesThree)
        .expect(200);

      const loginResFour = await loginRequest(user.email, 'password').expect(200);
      const cookiesFour = harness.expectCookies(harness.toCookiesArray(loginResFour.headers['set-cookie']), { requireAuth: true });
      const sessionsResFour = await harness
        .withAuth(request(harness.app.getHttpServer()).get('/auth/sessions'), cookiesFour)
        .expect(200);
      const sessionIdFour: string = sessionsResFour.body.data[0].id;

      await harness
        .withAuth(request(harness.app.getHttpServer()).post(`/auth/sessions/revoke/${sessionIdFour}`), cookiesFour)
        .expect(200);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/logout'), cookiesFour)
        .expect(200);
    });

    it('allows bearer Authorization header without cookies on protected routes', async () => {
      const user = await harness.registerUser();

      const loginRes = await loginRequest(user.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });
      const accessToken = harness.extractCookieValue(cookies, 'bsaas_at');
      expect(accessToken).toBeDefined();

      await request(harness.app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('logs out active sessions and clears persisted session records', async () => {
      const user = await harness.registerUser();

      const loginRes = await loginRequest(user.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      const sessionsBeforeLogout = await harness.prisma.session.findMany({ where: { userId: user.id } });
      expect(sessionsBeforeLogout.length).toBeGreaterThan(0);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/logout'), cookies)
        .expect(200);

      const sessionsAfterLogout = await harness.prisma.session.findMany({ where: { userId: user.id } });
      expect(sessionsAfterLogout).toHaveLength(0);
    });

    it('re-seeds auth roles when role table is empty', async () => {
      await harness.prisma.$transaction(async (trx) => {
        await trx.$executeRawUnsafe('LOCK TABLE "role" IN EXCLUSIVE MODE');
        await trx.userRole.deleteMany();
        await trx.role.deleteMany();
        // Manually invoke the shared seeder to mimic the bootstrap path without racing other workers.
        await ensureAuthRoles(trx);
      });

      const roles = await harness.prisma.role.findMany({ orderBy: { name: 'asc' } });
      const names = roles.map((role) => role.name);
      const expected = Object.values(UserRole).map((r) => r.toUpperCase()).slice().sort();
      expect(names).toEqual(expected);
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
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), initialCookies)
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
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/start'), cookies)
        .expect(200);
      expect(setupRes.body.qrCodeDataUrl).toBeDefined();
      const setupSecret = await decryptTotpSecret(user.id);

      const setupToken = authenticator.generate(setupSecret);
      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/totp/enroll/finish'), cookies)
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

      const codes: string[] = generateRes.body.data;
      expect(Array.isArray(codes)).toBe(true);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/recovery/verify'), cookies)
        .send({ code: codes[0] })
        .expect(200);

    });

    it('handles password reset and change lifecycle', async () => {
      const user = await harness.registerUser();

      const initialLogin = await loginRequest(user.email, 'password').expect(200);
      harness.expectCookies(harness.toCookiesArray(initialLogin.headers['set-cookie']), { requireAuth: true });

      const sessionsBeforeReset = await harness.prisma.session.findMany({ where: { userId: user.id } });
      expect(sessionsBeforeReset.length).toBeGreaterThan(0);

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

      const sessionsAfterReset = await harness.prisma.session.findMany({ where: { userId: user.id } });
      expect(sessionsAfterReset).toHaveLength(0);

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
        .post('/auth/email/verify/request')
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

    it('re-sends verification email for existing unverified account', async () => {
      const email = `resend-${randomUUID()}@example.com`;
      await harness.registerUser({ email, emailVerifiedAt: null, isVerified: false });
      harness.resetEmails();

      await request(harness.app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'Password#1' })
        .expect(201);

      const verificationMail = harness.sentEmails.find((mail) => mail.subject.includes('Verify your email'));
      expect(verificationMail).toBeDefined();
    });

    it('returns success without duplicate email flow when user is already verified', async () => {
      const email = `verified-${randomUUID()}@example.com`;
      await harness.registerUser({ email });
      harness.resetEmails();

      await request(harness.app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'Password#1' })
        .expect(201);

      expect(harness.sentEmails.length).toBe(0);
    });

    it('allows authenticated webauthn login start via optional user context', async () => {
      const user = await harness.registerUser();
      const loginRes = await loginRequest(user.email, 'password').expect(200);
      const cookies = harness.expectCookies(harness.toCookiesArray(loginRes.headers['set-cookie']), { requireAuth: true });

      const startRes = await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/webauthn/login/start'), cookies)
        .send({})
        .expect(200);
      expect(startRes.body.success).toBe(true);
    });

    it('allows webauthn login start via explicit userId payload', async () => {
      const user = await harness.registerUser();

      const startRes = await request(harness.app.getHttpServer())
        .post('/auth/webauthn/login/start')
        .send({ userId: user.id })
        .expect(200);
      expect(startRes.body.success).toBe(true);
    });

    it('extractUserId handles fallback id and missing user branches', () => {
      const controller = harness.app.get(AuthController) as unknown as { extractUserId: (input?: unknown) => string | undefined };
      expect(controller.extractUserId(undefined)).toBeUndefined();
      expect(controller.extractUserId({ id: 'fallback-id' })).toBe('fallback-id');
      expect(controller.extractUserId({ id: '' })).toBeUndefined();
    });

    describe('controller branch coverage helpers', () => {
      let controller: AuthController;
      let controllerAuthService: AuthService;
      let controllerCookies: AuthCookiesService;
      let recoveryPort: RecoveryCodesPort;
      let webAuthnPort: WebAuthnPort;
      let oauthPort: OAuthPort;
      let controllerContext: ContextId;

      const buildJwtUser = (overrides: Partial<JwtUserContext> = {}): JwtUserContext => ({
        userId: 'user-1',
        email: 'user@example.com',
        roles: [UserRole.CUSTOMER],
        sessionId: 'session-1',
        ...overrides,
      });

      const buildAuthenticatedUser = (
        overrides: Partial<AuthenticatedUser & { userId: string }> = {},
      ): AuthenticatedUser & { userId: string } => ({
        id: 'user-1',
        userId: 'user-1',
        email: 'user@example.com',
        roles: [UserRole.CUSTOMER],
        ...overrides,
      });

      beforeEach(async () => {
        controllerContext = ContextIdFactory.create();
        harness.app.registerRequestByContextId({}, controllerContext);
        controller = await harness.app.resolve(AuthController, controllerContext);
        controllerAuthService = Reflect.get(controller as unknown as object, 'authService') as AuthService;
        controllerCookies = Reflect.get(controller as unknown as object, 'authCookies') as AuthCookiesService;
        recoveryPort = Reflect.get(controller as unknown as object, 'recovery') as RecoveryCodesPort;
        webAuthnPort = Reflect.get(controller as unknown as object, 'webAuthn') as WebAuthnPort;
        oauthPort = Reflect.get(controller as unknown as object, 'oauth') as OAuthPort;
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('covers owner registration branches', async () => {
        const spy = jest.spyOn(controllerAuthService, 'completeOwnerRegistration');
        const cookieSpy = jest.spyOn(controllerCookies, 'issue').mockImplementation(() => undefined);
        const payload = {} as RegistrationCompleteInput;

        spy.mockResolvedValueOnce({ next: 'mfa' } as const);
        await expect(controller.completeOwnerRegistration(payload)).resolves.toEqual({ next: 'mfa' });
        expect(cookieSpy).not.toHaveBeenCalled();

        spy.mockResolvedValueOnce({ accessToken: 'owner-access', refreshToken: 'owner-refresh' });
        await expect(controller.completeOwnerRegistration(payload)).resolves.toEqual({});
        expect(cookieSpy).toHaveBeenCalledTimes(1);
      });

      it('covers staff registration branches', async () => {
        const spy = jest.spyOn(controllerAuthService, 'completeStaffRegistration');
        const cookieSpy = jest.spyOn(controllerCookies, 'issue').mockImplementation(() => undefined);
        const payload = {} as RegistrationCompleteInput;

        spy.mockResolvedValueOnce({ next: 'mfa' } as const);
        await expect(controller.completeStaffRegistration(payload)).resolves.toEqual({ next: 'mfa' });
        expect(cookieSpy).not.toHaveBeenCalled();

        spy.mockResolvedValueOnce({ accessToken: 'staff-access', refreshToken: 'staff-refresh' });
        await expect(controller.completeStaffRegistration(payload)).resolves.toEqual({});
        expect(cookieSpy).toHaveBeenCalledTimes(1);
      });

      it('covers refresh token cookie/body branches', async () => {
        const rotateSpy = jest.spyOn(controllerCookies, 'rotateOnRefresh').mockImplementation(() => undefined);
        jest
          .spyOn(controllerAuthService, 'refreshToken')
          .mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

        await controller.refresh({} as RefreshTokenDto, { headers: { cookie: 'bsaas_rt=cookie-token' } } as unknown as ExpressRequest);
        expect(rotateSpy).toHaveBeenCalledWith(expect.objectContaining({ refreshToken: 'r' }));

        await controller.refresh({ refreshToken: 'body-token' } as RefreshTokenDto, { headers: {} } as unknown as ExpressRequest);
        expect(rotateSpy).toHaveBeenCalledTimes(2);
      });

      it('covers recovery verification success and failure branches', async () => {
        const verifySpy = jest.spyOn(recoveryPort, 'verifyAndConsume');
        verifySpy.mockResolvedValueOnce(false);
        await expect(controller.verifyRecovery({ code: 'bad' }, { user: buildJwtUser() })).rejects.toThrow(
          BadRequestException,
        );

        verifySpy.mockResolvedValueOnce(true);
        await expect(controller.verifyRecovery({ code: 'good' }, { user: buildJwtUser() })).resolves.toEqual({
          success: true,
        });
      });

      it('covers sign-in totp and standard branches', async () => {
        const cookieSpy = jest.spyOn(controllerCookies, 'issue').mockImplementation(() => undefined);
        const signInSpy = jest.spyOn(controllerAuthService, 'signIn');

        const totpResult: AuthSignInResult = { totpRequired: true, tempToken: 'temp-token' };
        signInSpy.mockResolvedValueOnce(totpResult);
        await expect(
          controller.signIn({ email: 'totp@example.com', password: 'Password#1' } as LoginDto),
        ).resolves.toEqual({ totpRequired: true, tempToken: 'temp-token' });
        expect(cookieSpy).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ accessToken: undefined, refreshToken: undefined }),
        );

        const tokenResult: AuthSignInResult = {
          totpRequired: false,
          accessToken: 'access',
          refreshToken: 'refresh',
        };
        signInSpy.mockResolvedValueOnce(tokenResult);
        await expect(
          controller.signIn({ email: 'regular@example.com', password: 'Password#1' } as LoginDto),
        ).resolves.toEqual({ totpRequired: false });
        expect(cookieSpy).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ accessToken: 'access', refreshToken: 'refresh' }),
        );
      });

      it('covers refresh missing token branch', async () => {
        await expect(
          controller.refresh({} as RefreshTokenDto, { headers: {} } as unknown as ExpressRequest),
        ).rejects.toThrow(BadRequestException);
      });

      it('covers webauthn login start branches', async () => {
        const resolveSpy = jest.spyOn(controllerAuthService, 'resolveUserIdByEmail').mockResolvedValueOnce('user-by-email');
        const startSpy = jest.spyOn(webAuthnPort, 'startAuthentication').mockResolvedValueOnce({ via: 'email' });

        await expect(controller.webauthnLoginStart({ email: 'email@example.com' }, undefined)).resolves.toEqual({ via: 'email' });
        expect(resolveSpy).toHaveBeenCalledWith('email@example.com');
        expect(startSpy).toHaveBeenCalledWith('user-by-email');

        startSpy.mockResolvedValueOnce({ via: 'user' });
        const authUser = buildAuthenticatedUser({
          id: 'user-123',
          userId: 'user-123',
          email: 'user-123@example.com',
        });
        await expect(controller.webauthnLoginStart({}, authUser)).resolves.toEqual({ via: 'user' });

        await expect(controller.webauthnLoginStart({}, undefined)).rejects.toThrow(BadRequestException);
        expect(startSpy).toHaveBeenCalledTimes(2);
      });

      it('covers webauthn login finish branches', async () => {
        await expect(controller.webauthnLoginFinish({ response: {} } as WebauthnAssertionDto, undefined)).rejects.toThrow(
          UnauthorizedException,
        );

        const finishSpy = jest
          .spyOn(webAuthnPort, 'finishAuthentication')
          .mockResolvedValueOnce({ credentialId: 'credential-id', counter: 1 });
        const tokenSpy = jest.spyOn(controllerAuthService, 'issueTokensForUser').mockResolvedValueOnce({
          accessToken: 'web-access',
          refreshToken: 'web-refresh',
        });
        const cookieSpy = jest.spyOn(controllerCookies, 'issue').mockImplementation(() => undefined);

        await expect(
          controller.webauthnLoginFinish(
            { response: {} } as WebauthnAssertionDto,
            buildAuthenticatedUser({
              id: 'user-123',
              userId: 'user-123',
              email: 'user-123@example.com',
            }),
          ),
        ).resolves.toEqual({});
        expect(finishSpy).toHaveBeenCalledWith('user-123', expect.any(Object));
        expect(tokenSpy).toHaveBeenCalledWith('user-123');
        expect(cookieSpy).toHaveBeenCalledWith(
          expect.objectContaining({ accessToken: 'web-access', refreshToken: 'web-refresh' }),
        );
      });

      it('covers oauth callback branches', async () => {
        await expect(controller.oauthCallback('google', undefined, undefined, undefined)).rejects.toThrow(
          BadRequestException,
        );

        const exchangeSpy = jest.spyOn(oauthPort, 'exchangeCode');
        exchangeSpy.mockResolvedValueOnce({ provider: 'google', providerUserId: 'profile-link' });
        const linkSpy = jest.spyOn(controllerAuthService, 'linkSocialAccount').mockResolvedValueOnce(undefined);

        await expect(controller.oauthCallback('google', buildAuthenticatedUser(), 'code', 'state')).resolves.toEqual({});
        expect(linkSpy).toHaveBeenCalledWith('user-1', 'google', 'profile-link');

        const cookieSpy = jest.spyOn(controllerCookies, 'issue').mockImplementation(() => undefined);
        exchangeSpy.mockResolvedValueOnce({ provider: 'google', providerUserId: 'profile-sign' });
        jest
          .spyOn(controllerAuthService, 'signInWithSocial')
          .mockResolvedValueOnce({ accessToken: 'oauth-access', refreshToken: 'oauth-refresh' });

        await expect(controller.oauthCallback('google', undefined, 'code', 'state')).resolves.toEqual({});
        expect(cookieSpy).toHaveBeenCalledWith(
          expect.objectContaining({ accessToken: 'oauth-access', refreshToken: 'oauth-refresh' }),
        );
      });

      it('covers email verification confirm branches', async () => {
        const verifyEmailSpy = jest.spyOn(controllerAuthService, 'verifyEmail').mockResolvedValueOnce(undefined);
        await expect(controller.emailVerifyConfirm({ token: 'token' })).resolves.toEqual({ success: true });
        expect(verifyEmailSpy).toHaveBeenCalledWith('token');

        const verifyOtpSpy = jest.spyOn(controllerAuthService, 'verifyEmailOtp').mockResolvedValueOnce(undefined);
        await expect(controller.emailVerifyConfirm({ email: 'user@example.com', otp: '123456' })).resolves.toEqual({ success: true });
        expect(verifyOtpSpy).toHaveBeenCalledWith('user@example.com', '123456');

        await expect(controller.emailVerifyConfirm({})).rejects.toThrow(BadRequestException);
      });

    });

    describe('auth cookies service coverage', () => {
      let requestContext: ContextId;
      let cookieService: AuthCookiesService;
      let cookieRegistry: CookieRegistry;

      const resolveRequestScope = async () => {
        requestContext = ContextIdFactory.create();
        harness.app.registerRequestByContextId({}, requestContext);
        cookieService = await harness.app.resolve(AuthCookiesService, requestContext);
        cookieRegistry = await harness.app.resolve(CookieRegistry, requestContext);
      };

      const drainCommands = () => cookieRegistry.drain();

      beforeEach(async () => {
        await resolveRequestScope();
      });

      afterEach(() => {
        drainCommands();
      });

      it('sets only the CSRF cookie when tokens are omitted', async () => {
        cookieService.issue({ csrf: 'csrf-only' });
        const commands = drainCommands();
        expect(commands).toEqual([
          expect.objectContaining({
            action: 'set',
            name: 'XSRF-TOKEN',
            value: 'csrf-only',
            options: expect.objectContaining({ httpOnly: false, secure: true, sameSite: 'lax', path: '/' }),
          }),
        ]);
      });

      it('issues access and refresh tokens with configured domain during rotation', async () => {
        const authConfig = configService.auth as { cookieDomain?: string };
        const originalDomain = authConfig.cookieDomain;
        authConfig.cookieDomain = 'example.com';

        try {
          cookieService.rotateOnRefresh({ csrf: 'csrf-value', accessToken: 'access-token', refreshToken: 'refresh-token' });
          const commands = drainCommands();
          expect(commands).toHaveLength(3);
          const access = commands.find((cmd) => cmd.name === 'bsaas_at');
          expect(access).toEqual(
            expect.objectContaining({
              action: 'set',
              name: 'bsaas_at',
              value: 'access-token',
              options: expect.objectContaining({ domain: 'example.com', httpOnly: true, secure: true, sameSite: 'lax', path: '/' }),
            }),
          );
          const refresh = commands.find((cmd) => cmd.name === 'bsaas_rt');
          expect(refresh).toEqual(
            expect.objectContaining({
              action: 'set',
              name: 'bsaas_rt',
              value: 'refresh-token',
              options: expect.objectContaining({ domain: 'example.com', httpOnly: true, secure: true, sameSite: 'lax', path: '/auth' }),
            }),
          );
        } finally {
          authConfig.cookieDomain = originalDomain;
        }
      });

      it('queues cookie clear commands during logout', async () => {
        cookieService.clear();
        const commands = drainCommands();
        expect(commands).toEqual([
          expect.objectContaining({ action: 'clear', name: 'bsaas_rt', options: expect.objectContaining({ path: '/auth' }) }),
          expect.objectContaining({ action: 'clear', name: 'bsaas_at', options: expect.objectContaining({ path: '/' }) }),
        ]);
      });
    });

    describe('auth service register coverage', () => {
      let authService: AuthService;

      beforeEach(async () => {
        authService = harness.app.get(AuthService);
        await ensureAuthRoles(harness.prisma);
      });

      it('registers new accounts and sends verification email', async () => {
        const email = `service-new-${randomUUID()}@example.com`;
        harness.resetEmails();

        await authService.register(email, 'Password#1');

        const created = await harness.prisma.user.findUnique({ where: { email } });
        expect(created).toBeTruthy();
        if (!created) {
          throw new Error('Expected new user to be created');
        }
        harness.trackUser(created.id);
        expect(created.name).toBeNull();
        expect(created.emailVerifiedAt).toBeNull();

        const verificationMail = harness.sentEmails.find((mail) => mail.to === email && mail.subject.includes('Verify your email'));
        expect(verificationMail).toBeDefined();
      });

      it('uses requestEmailVerification when existing account is unverified', async () => {
        const email = `service-unverified-${randomUUID()}@example.com`;
        await harness.registerUser({ email, emailVerifiedAt: null, isVerified: false });
        harness.resetEmails();

        await authService.register(email, 'Password#1');

        const verificationMail = harness.sentEmails.find((mail) => mail.subject.includes('Verify your email'));
        expect(verificationMail).toBeDefined();
      });

      it('skips verification mail when account is already verified', async () => {
        const email = `service-verified-${randomUUID()}@example.com`;
        await harness.registerUser({ email });
        harness.resetEmails();

        await authService.register(email, 'Password#1');

        expect(harness.sentEmails.length).toBe(0);
      });
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
      // Assert deterministic stub challenge in envelope data
      const regData = registerStartRes.body.data as { challenge?: string };
      expect(typeof regData?.challenge).toBe('string');
      expect(regData!.challenge!).toMatch(/^reg-/);

      await harness
        .withAuth(request(harness.app.getHttpServer()).post('/auth/webauthn/register/finish'), cookies)
        .send({ response: {} })
        .expect(200);

      const loginStartRes = await request(harness.app.getHttpServer())
        .post('/auth/webauthn/login/start')
        .send({ email: user.email })
        .expect(200);
      expect(loginStartRes.body.success).toBe(true);
      const authData = loginStartRes.body.data as { challenge?: string };
      expect(typeof authData?.challenge).toBe('string');
      expect(authData!.challenge!).toMatch(/^auth-/);

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

      const webAuthnAdapter = harness.app.get<WebAuthnPort>(WEB_AUTHN_PORT);
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

    it('starts OAuth flow and returns provider redirect', async () => {
      const res = await request(harness.app.getHttpServer()).get('/auth/oauth/google/start').expect(302);
      const location = res.headers['location'];
      expect(typeof location).toBe('string');
      expect(location.length).toBeGreaterThan(0);
    });

    it('confirms email verification with a valid token', async () => {
      const user = await harness.registerUser({ email: `verify-success-${randomUUID()}@example.com`, emailVerifiedAt: null, isVerified: false });
      const token = await harness.jwtService.signAsync(
        { sub: user.id, aud: 'verify' },
        { secret: configService.auth.jwtVerifyEmailSecret },
      );

      await request(harness.app.getHttpServer())
        .post('/auth/email/verify/confirm')
        .send({ token })
        .expect(200);

      const updated = await harness.prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.emailVerifiedAt).toBeTruthy();
    });
  });
});
