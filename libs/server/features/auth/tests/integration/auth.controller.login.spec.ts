import { Test } from '@nestjs/testing';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import { AuthService } from '../../src/lib/services/auth.service';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtModule } from '@nestjs/jwt';
import { AuditService } from '../../src/lib/services/audit.service';
import { AuthCookiesService } from '../../src/lib/services/auth-cookies.service';
import { ConfigModule, CookieRegistry, CookiesInterceptor, ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import { LoginDto } from '../../src/lib/dto/login.dto';
import { PrismaClient, User } from '@prisma/client';
import { HttpAdapterHost } from '@nestjs/core';
import {
  UserRepository,
  SessionRepository,
  RefreshTokenRepository,
  SocialAccountRepository,
  CredentialTotpRepository,
  EmailVerificationRepository,
  PasswordResetRepository,
  PrismaService,
} from '@cthub-bsaas/server-data-access';
import { TotpOtplibAdapter, WebAuthnStubAdapter, RecoveryCodesMemoryAdapter, OAuthAdapter } from '@cthub-bsaas/server-infrastructure';
import { EncryptionService } from '@cthub-bsaas/server-core';
import { deleteTestUser, createCustomerTestUser } from '@cthub-bsaas/server-testing-utils';
import { randomUUID } from 'crypto';
import { JwtStrategy } from '../../src/lib/strategies/jwt.strategy';
import {
  USER_REPOSITORY,
  SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  SOCIAL_ACCOUNT_REPOSITORY,
  CREDENTIAL_TOTP_REPOSITORY,
  TOTP_PORT,
  EMAIL_PORT,
  EMAIL_VERIFICATION_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
  WEB_AUTHN_PORT,
  RECOVERY_CODES_PORT,
  OAUTH_PORT,
} from '@cthub-bsaas/server-contracts-auth';

describe('AuthController Login (E2E) - SSoT', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let user: User;
  let currentEmail: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        JwtModule.register({
          secret: 'test-secret-for-ssot-spec',
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: USER_REPOSITORY, useClass: UserRepository },
        { provide: SESSION_REPOSITORY, useClass: SessionRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
        { provide: SOCIAL_ACCOUNT_REPOSITORY, useClass: SocialAccountRepository },
        { provide: CREDENTIAL_TOTP_REPOSITORY, useClass: CredentialTotpRepository },
        { provide: EMAIL_VERIFICATION_REPOSITORY, useClass: EmailVerificationRepository },
        { provide: PASSWORD_RESET_REPOSITORY, useClass: PasswordResetRepository },
        { provide: TOTP_PORT, useClass: TotpOtplibAdapter },
        { provide: EMAIL_PORT, useValue: { sendMail: jest.fn() } },
        { provide: WEB_AUTHN_PORT, useClass: WebAuthnStubAdapter },
        { provide: RECOVERY_CODES_PORT, useClass: RecoveryCodesMemoryAdapter },
        { provide: OAUTH_PORT, useClass: OAuthAdapter },
        AuditService,
        AuthCookiesService,
        CookieRegistry,
        ResponseEnvelopeInterceptor,
        CookiesInterceptor,
        PrismaService,
        EncryptionService,
        HttpAdapterHost,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    currentEmail = `test.${randomUUID()}@example.com`;
    user = await createCustomerTestUser(prisma, currentEmail);
  });

  afterEach(async () => {
    await deleteTestUser(prisma, user);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should return a temp token if TOTP is required', async () => {
    const encryptionService = app.get<EncryptionService>(EncryptionService);
    const secret = 'test-secret';
    const secretEncrypted = Buffer.from(encryptionService.encrypt(secret));

    await prisma.credentialTOTP.create({
      data: {
        userId: user.id,
        secretEncrypted,
        verified: true,
      },
    });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: currentEmail, password: 'password' } as LoginDto)
      .expect(200)
      .then((res) => {
        expect(res.body.data.totpRequired).toBe(true);
        expect(res.body.data.tempToken).toBeDefined();
      });
  });

  it('should return an access token and refresh token if TOTP is not required', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: currentEmail, password: 'password' } as LoginDto)
      .expect(200)
      .then((res) => {
        expect(res.body.data.totpRequired).toBe(false);
      });
  });
});
