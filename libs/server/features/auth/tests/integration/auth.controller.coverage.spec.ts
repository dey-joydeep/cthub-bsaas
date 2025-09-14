import { Test } from '@nestjs/testing';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import { AuthService } from '../../src/lib/services/auth.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import { EmailChangeRequestDto } from '../../src/lib/dto/email-change-request.dto';
import { PasswordChangeDto } from '../../src/lib/dto/password-change.dto';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT, AuthCookiesService, WebAuthnPort, RecoveryCodesPort, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { ConfigService } from '@nestjs/config';
import { CookieRegistry, CookiesInterceptor, JwtAuthGuard } from '@cthub-bsaas/server-core';
import * as request from 'supertest';

describe('AuthController Coverage', () => {
  let app: INestApplication;
  let authService: MockProxy<AuthService>;

  beforeEach(async () => {
    authService = mock<AuthService>();
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthCookiesService, useValue: mock<AuthCookiesService>() },
        { provide: WEB_AUTHN_PORT, useValue: mock<WebAuthnPort>() },
        { provide: RECOVERY_CODES_PORT, useValue: mock<RecoveryCodesPort>() },
        { provide: OAUTH_PORT, useValue: mock<OAuthPort>() },
        { provide: ConfigService, useValue: { get: () => 'test-secret' } },
        CookieRegistry,
        CookiesInterceptor,
      ],
    })
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('should call requestEmailChange', async () => {
    await request(app.getHttpServer())
      .post('/auth/email/change/request')
      .send({ newEmail: 'new@example.com' } as EmailChangeRequestDto)
      .expect(202);
    expect(authService.requestEmailChange).toHaveBeenCalled();
  });

  it('should call changePassword', async () => {
    await request(app.getHttpServer())
      .post('/auth/password/change')
      .send({ currentPassword: '1', newPassword: '2' } as PasswordChangeDto)
      .expect(200);
    expect(authService.changePassword).toHaveBeenCalled();
  });
});
