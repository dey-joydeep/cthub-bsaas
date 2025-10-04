import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '@cthub-bsaas/server-core';

import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
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
  INVITE_PORT,
} from '@cthub-bsaas/server-contracts-auth';
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
import {
  WebAuthnStubAdapter,
  RecoveryCodesMemoryAdapter,
  OAuthAdapter,
  TotpOtplibAdapter,
  InvitePrismaAdapter,
} from '@cthub-bsaas/server-infrastructure';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { TotpController } from '../../../src/lib/controllers/totp.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import { AuditService } from '../../../src/lib/services/audit.service';
import { JwtStrategy } from '../../../src/lib/strategies/jwt.strategy';
import { ConfigModule, CookieRegistry, CookiesInterceptor, EncryptionService, ResponseEnvelopeInterceptor, CsrfGuard, LoggerService } from '@cthub-bsaas/server-core';
import { APP_GUARD, HttpAdapterHost } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { EmailPort } from '@cthub-bsaas/server-contracts-auth';

export interface AuthTestOptions {
  jwtSecret?: string;
  emailPort?: EmailPort;
}

export interface AuthTestContext {
  app: INestApplication;
  prisma: PrismaClient;
  jwtService: JwtService;
  encryptionService: EncryptionService;
  emailPort: EmailPort;
  close(): Promise<void>;
}



export async function createAuthTestContext(options: AuthTestOptions = {}): Promise<AuthTestContext> {


  const emailPort: EmailPort =
    options.emailPort ??
    ({
      async sendMail() {
        /* noop */
      },
    } as EmailPort);

  const testEncryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.ENCRYPTION_KEY ??= testEncryptionKey;
  process.env.ENCRYPTION_TEST_KEY ??= testEncryptionKey;

  const testingModule = await Test.createTestingModule({
    imports: [
      ConfigModule,
      ThrottlerModule.forRoot({ throttlers: [{ ttl: 60, limit: 5 }] }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({
        secret:
          options.jwtSecret ?? process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'test-access-secret',
        signOptions: { expiresIn: '60s' },
      }),
    ],
    controllers: [AuthController, TotpController],
    providers: [
      AuthService,
      JwtStrategy,
      { provide: USER_REPOSITORY, useClass: UserRepository },
      { provide: SESSION_REPOSITORY, useClass: SessionRepository },
      { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
      { provide: SOCIAL_ACCOUNT_REPOSITORY, useClass: SocialAccountRepository },
      CredentialTotpRepository,
      { provide: CREDENTIAL_TOTP_REPOSITORY, useExisting: CredentialTotpRepository },
      { provide: EMAIL_VERIFICATION_REPOSITORY, useClass: EmailVerificationRepository },
      { provide: PASSWORD_RESET_REPOSITORY, useClass: PasswordResetRepository },
      {
        provide: TOTP_PORT,
        useClass: TotpOtplibAdapter,
      },
      { provide: EMAIL_PORT, useValue: emailPort },
      { provide: INVITE_PORT, useClass: InvitePrismaAdapter },
      { provide: WEB_AUTHN_PORT, useClass: WebAuthnStubAdapter },
      { provide: RECOVERY_CODES_PORT, useClass: RecoveryCodesMemoryAdapter },
      { provide: OAUTH_PORT, useClass: OAuthAdapter },
      { provide: LoggerService, useValue: { access: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } },
      AuditService,
      AuthCookiesService,
      CookieRegistry,
      ResponseEnvelopeInterceptor,
      CookiesInterceptor,
      PrismaService,
      EncryptionService,

      HttpAdapterHost,
      JwtAuthGuard,
      {
        provide: APP_GUARD,
        useClass: CsrfGuard,
      },
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
    ],
  }).compile();

  const app = testingModule.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();


  const prisma = new PrismaClient();
  const jwtService = app.get(JwtService);
  const encryptionService = app.get(EncryptionService);

  return {
    app,
    prisma,
    jwtService,
    encryptionService,
    emailPort,
    async close() {
      await app.close();
      await prisma.$disconnect();
    },
  };
}
