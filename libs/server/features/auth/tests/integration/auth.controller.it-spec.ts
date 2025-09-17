import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { randomUUID } from 'crypto';

import { AuthController } from '../../src/lib/controllers/auth.controller';
import { AuthService } from '../../src/lib/services/auth.service';
import { AuthCookiesService } from '../../src/lib/services/auth-cookies.service';
import { AuditService } from '../../src/lib/services/audit.service';
import { ConfigModule, CookieRegistry, CookiesInterceptor, ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import { HttpAdapterHost } from '@nestjs/core';
import { createCustomerTestUser, deleteTestUser } from '@cthub-bsaas/server-testing-utils';

import {
  USER_REPOSITORY,
  SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  SOCIAL_ACCOUNT_REPOSITORY,
  CREDENTIAL_TOTP_REPOSITORY,
  EMAIL_VERIFICATION_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  WEB_AUTHN_PORT,
  RECOVERY_CODES_PORT,
  OAUTH_PORT,
  TOTP_PORT,
  EMAIL_PORT,
} from '@cthub-bsaas/server-contracts-auth';

import { UserRepository, SessionRepository, RefreshTokenRepository, SocialAccountRepository, CredentialTotpRepository, EmailVerificationRepository, PasswordResetRepository, PrismaService } from '@cthub-bsaas/server-data-access';
import { WebAuthnStubAdapter, RecoveryCodesMemoryAdapter, OAuthAdapter, TotpOtplibAdapter } from '@cthub-bsaas/server-infrastructure';
import { EncryptionService } from '@cthub-bsaas/server-core';
import { JwtStrategy } from '../../src/lib/strategies/jwt.strategy';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const prisma = new PrismaClient();

  let user: User;
  let accessToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        JwtModule.register({
          secret:
            process.env.JWT_ACCESS_SECRET ||
            process.env.JWT_SECRET ||
            'test-access-secret',
          signOptions: { expiresIn: '60s' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        AuthCookiesService,
        AuditService,
        JwtStrategy,
        CookieRegistry,
        CookiesInterceptor,
        ResponseEnvelopeInterceptor,
        PrismaService,
        EncryptionService,
        HttpAdapterHost,
        { provide: USER_REPOSITORY, useClass: UserRepository },
        { provide: SESSION_REPOSITORY, useClass: SessionRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useClass: SocialAccountRepository },
        { provide: CREDENTIAL_TOTP_REPOSITORY, useClass: CredentialTotpRepository },
        { provide: EMAIL_VERIFICATION_REPOSITORY, useClass: EmailVerificationRepository },
        { provide: PASSWORD_RESET_REPOSITORY, useClass: PasswordResetRepository },
        { provide: WEB_AUTHN_PORT, useClass: WebAuthnStubAdapter },
        { provide: RECOVERY_CODES_PORT, useClass: RecoveryCodesMemoryAdapter },
        { provide: OAUTH_PORT, useClass: OAuthAdapter },
        { provide: TOTP_PORT, useClass: TotpOtplibAdapter },
        { provide: EMAIL_PORT, useValue: { sendMail: jest.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    jwtService = app.get<JwtService>(JwtService);
  });

  beforeEach(async () => {
    const email = `test.${randomUUID()}@example.com`;
    user = await createCustomerTestUser(prisma, email);
    const session = await prisma.session.create({ data: { userId: user.id } });
    accessToken = jwtService.sign({ sub: user.id, sessionId: session.id });
  });

  afterEach(async () => {
    await deleteTestUser(prisma, user);
  });

    afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    const controller = app.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should list user sessions for /auth/sessions', async () => {
    return request(app.getHttpServer())
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBe(1);
      });
  });

  it('should logout and clear cookies', async () => {
    return request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .then((res) => {
        expect(res.headers['set-cookie']).toBeDefined();
        expect(res.body.data.success).toBe(true);
      });
  });
});