import { Test } from '@nestjs/testing';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import { AuthService } from '../../src/lib/services/auth.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { BadRequestException, ExecutionContext, INestApplication } from '@nestjs/common';
import { EmailChangeRequestDto } from '../../src/lib/dto/email-change-request.dto';
import { PasswordChangeDto } from '../../src/lib/dto/password-change.dto';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT, AuthCookiesService, WebAuthnPort, RecoveryCodesPort, OAuthPort, USER_REPOSITORY, SESSION_REPOSITORY, REFRESH_TOKEN_REPOSITORY, SOCIAL_ACCOUNT_REPOSITORY, CREDENTIAL_TOTP_REPOSITORY, EMAIL_VERIFICATION_REPOSITORY, PASSWORD_RESET_REPOSITORY, CREDENTIAL_PASSKEY_REPOSITORY } from '@cthub-bsaas/server-contracts-auth';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { CookieRegistry, CookiesInterceptor, JwtAuthGuard, EncryptionService } from '@cthub-bsaas/server-core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuditService } from '../../src/lib/services/audit.service';
import { PrismaClient } from '@prisma/client';
import { PrismaModule, PrismaService } from '@cthub-bsaas/server-data-access';
import { TotpController } from '../../src/lib/controllers/totp.controller';
import { TotpService } from '../../src/lib/services/totp.service';
import { TotpModule, EmailModule, InviteModule, WebAuthnModule, RecoveryModule, OAuthModule } from '@cthub-bsaas/server-infrastructure';
import { JwtStrategy } from '../../src/lib/strategies/jwt.strategy';
import { mockDeep } from 'jest-mock-extended';

describe('AuthController Coverage', () => {
  let app: INestApplication;
  let authService: MockProxy<AuthService>;
  let webAuthnPort: MockProxy<WebAuthnPort>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      JwtModule.register({ secret: 'test-secret' }),
      PrismaModule,
      TotpModule,
      EmailModule,
      InviteModule,
      WebAuthnModule,
      RecoveryModule,
      OAuthModule,
    ],
    controllers: [AuthController, TotpController],
    providers: [
      AuthService,
      AuthCookiesService,
      CookieRegistry,
      CookiesInterceptor,
      JwtStrategy,
      AuditService,
      TotpService,
      EncryptionService,
      {
        provide: USER_REPOSITORY,
        useValue: mockDeep<any>()
      },
      {
        provide: SESSION_REPOSITORY,
        useValue: mockDeep<any>()
      },
      {
        provide: REFRESH_TOKEN_REPOSITORY,
        useValue: mockDeep<any>()
      },
      {
        provide: SOCIAL_ACCOUNT_REPOSITORY,
        useValue: mockDeep<any>()
      },
      {
        provide: CREDENTIAL_TOTP_REPOSITORY,
        useValue: mockDeep<any>()
      },
      {
        provide: EMAIL_VERIFICATION_REPOSITORY,
        useValue: mockDeep<any>()
      },
      {
        provide: PASSWORD_RESET_REPOSITORY,
        useValue: mockDeep<any>()
      },
      {
        provide: CREDENTIAL_PASSKEY_REPOSITORY,
        useValue: mockDeep<any>()
      },
    ],
  })
  .overrideProvider(PrismaService).useValue(mockDeep<PrismaClient>())
  .overrideGuard(JwtAuthGuard)
      .useClass(
        class MockAuthGuard {
          canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest();
            request.user = { userId: 'test' };
            return true;
          }
        },
      )
      .compile();

    app = module.createNestApplication();
    await app.init();
    authService = app.get(AuthService);
    webAuthnPort = app.get(WEB_AUTHN_PORT);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should throw a BadRequestException if the email change request fails', async () => {
    const controller = app.get<AuthController>(AuthController);
    (authService.requestEmailChange as jest.Mock).mockRejectedValue(new BadRequestException());
    await expect(controller.requestEmailChange({ newEmail: 'new@example.com' } as EmailChangeRequestDto, { user: { userId: 'test' } })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw a BadRequestException if the password change fails', async () => {
    const controller = app.get<AuthController>(AuthController);
    (authService.changePassword as jest.Mock).mockRejectedValue(new BadRequestException());
    await expect(controller.changePassword({ currentPassword: '1', newPassword: '2' } as PasswordChangeDto, { user: { userId: 'test' } })).rejects.toThrow(
      BadRequestException,
    );
  });
});