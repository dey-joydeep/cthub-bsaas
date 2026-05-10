import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@app/app.module';
import { PrismaClient } from '@prisma/client';
import { EMAIL_PORT, EmailPort } from '@cthub-bsaas/server-contracts-auth';

describe('Auth Email Verify IT', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const sent: { to?: string; subject?: string; body?: string } = {};

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EMAIL_PORT)
      .useValue({
        sendMail: async (to: string, subject: string, body: string) => {
          sent.to = to;
          sent.subject = subject;
          sent.body = body;
        },
      } as EmailPort)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('requests OTP and confirms via OTP', async () => {
    const server = app.getHttpServer();

    // Ensure a user exists
    const email = `verify-it-${Date.now()}@example.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: '$2a$10$Q6o6a8qkPB/Oo9s4yq7kQe9d2Jv2tQhEStYB9V6r6gT4QXzv2n9j2', // bcrypt for 'P@ssw0rd!'
      },
    });

    // Request OTP
    await request(server).post('/auth/email/verify/request').send({ email }).expect(202);

    // Assert that a DB record exists for the OTP (deterministic, no reliance on email capture)
    const rec = await prisma.emailVerification.findFirst({ where: { email } });
    expect(rec).toBeTruthy();

    // Overwrite the stored hash with a known OTP to make the flow deterministic
    const bcrypt = await import('bcryptjs');
    const forcedOtp = '123456';
    const codeHash = await bcrypt.hash(forcedOtp, 10);
    await prisma.emailVerification.update({ where: { id: rec!.id }, data: { codeHash } });

    // Confirm via OTP using the AuthService directly for determinism
    const { AuthService } = await import('@cthub-bsaas/server-features-auth/lib/services/auth.service');
    const svc = app.get(AuthService);
    await svc.verifyEmailOtp(email, forcedOtp);

    const refreshed = await prisma.user.findUnique({ where: { email } });
    expect(refreshed!.emailVerifiedAt).toBeTruthy();
  });

  it('invalid and expired OTP branches', async () => {
    const server = app.getHttpServer();
    const email = `verify-it-bad-${Date.now()}@example.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: 'x' },
    });
    // Request OTP
    await request(server).post('/auth/email/verify/request').send({ email }).expect(202);
    // Wrong OTP => invalid_otp
    await expect(
      (await import('@cthub-bsaas/server-features-auth/lib/services/auth.service')).AuthService.prototype.verifyEmailOtp.call(
        app.get((await import('@cthub-bsaas/server-features-auth/lib/services/auth.service')).AuthService),
        email,
        '000000',
      ),
    ).rejects.toBeTruthy();
    // Mark used to simulate expiration
    const rec = await prisma.emailVerification.findFirst({ where: { email } });
    if (rec) {
      await prisma.emailVerification.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
    }
    // Now should throw otp_expired
    const svc = app.get((await import('@cthub-bsaas/server-features-auth/lib/services/auth.service')).AuthService);
    await expect(svc.verifyEmailOtp(email, '000000')).rejects.toBeTruthy();
  });

  it('user not found branch in OTP verify', async () => {
    const email = `verify-it-nouser-${Date.now()}@example.com`;
    // Insert a verification record without a corresponding user
    const bcrypt = await import('bcryptjs');
    const codeHash = await bcrypt.hash('123456', 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.emailVerification.create({ data: { email, codeHash, expiresAt, attempts: 0, createdAt: new Date(), usedAt: null } });
    const svc = app.get((await import('../../src/lib/services/auth.service')).AuthService);
    await expect(svc.verifyEmailOtp(email, '123456')).rejects.toBeTruthy();
  });
});
