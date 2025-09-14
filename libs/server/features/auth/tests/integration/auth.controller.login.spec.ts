import { Test } from '@nestjs/testing';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import { AuthService } from '../../src/lib/services/auth.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { LoginDto } from '../../src/lib/dto/login.dto';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthCookiesService } from '../../src/lib/services/auth-cookies.service';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { ConfigService } from '@nestjs/config';
import { CookieRegistry, CookiesInterceptor } from '@cthub-bsaas/server-core';

describe('AuthController Login', () => {
  let app: INestApplication;
  let authService: MockProxy<AuthService>;

  beforeEach(async () => {
    authService = mock<AuthService>();
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AuthCookiesService, useValue: mock<AuthCookiesService>() },
        { provide: WEB_AUTHN_PORT, useValue: mock() },
        { provide: RECOVERY_CODES_PORT, useValue: mock() },
        { provide: OAUTH_PORT, useValue: mock() },
        { provide: ConfigService, useValue: { get: () => 'test-secret' } },
        CookieRegistry,
        CookiesInterceptor,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should return a temp token if TOTP is required', async () => {
    authService.signIn.mockResolvedValue({ totpRequired: true, tempToken: 'temp-token' });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' } as LoginDto)
      .expect(200)
      .expect({ success: true, data: { totpRequired: true, tempToken: 'temp-token' } });
  });

  it('should return an access token and refresh token if TOTP is not required', async () => {
    authService.signIn.mockResolvedValue({ totpRequired: false, accessToken: 'access-token', refreshToken: 'refresh-token' });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' } as LoginDto)
      .expect(200)
      .expect({ success: true, data: { totpRequired: false } });
  });
});
