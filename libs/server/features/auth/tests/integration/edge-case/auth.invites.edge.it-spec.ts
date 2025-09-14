import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { CookieRegistry, CookiesInterceptor } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT, INVITE_PORT } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../../../src/lib/services/auth.service';

describe('AuthController Invites (integration)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController],
      providers: [
        CookieRegistry,
        CookiesInterceptor,
        AuthCookiesService,
        {
          provide: AuthService,
          useValue: {
            validateOwnerInvite: jest.fn().mockResolvedValue({ email: 'owner@test.com', salonId: 'salon1' }),
            completeOwnerRegistration: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
            validateStaffInvite: jest.fn().mockResolvedValue({ email: 'staff@test.com', salonId: 'salon1' }),
            completeStaffRegistration: jest.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
          },
        },
        { provide: WEB_AUTHN_PORT, useValue: {} },
        { provide: RECOVERY_CODES_PORT, useValue: {} },
        { provide: OAUTH_PORT, useValue: {} },
        { provide: INVITE_PORT, useValue: {} },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    authService = moduleRef.get<AuthService>(AuthService);
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /auth/owner/registration/:token should validate owner invite', () => {
    return request(app.getHttpServer())
      .get('/auth/owner/registration/some-token')
      .expect(200)
      .then(res => {
          expect(res.body).toEqual({
            success: true,
            data: {
              valid: true,
              email: 'owner@test.com',
              salonId: 'salon1',
            }
          });
      });
  });

  it('POST /auth/owner/registration/complete should complete owner registration', () => {
    return request(app.getHttpServer())
      .post('/auth/owner/registration/complete')
      .send({ token: 'some-token', password: 'password' })
      .expect(201)
      .then(res => {
        expect(res.body).toEqual({ success: true, data: {} });
      });
  });

  it('POST /auth/owner/registration/complete should handle MFA branch', () => {
    jest.spyOn(authService, 'completeOwnerRegistration').mockResolvedValue({ next: 'mfa' });
    return request(app.getHttpServer())
      .post('/auth/owner/registration/complete')
      .send({ token: 'some-token', password: 'password' })
      .expect(201)
      .then(res => {
        expect(res.body).toEqual({ success: true, data: { next: 'mfa' } });
      });
  });

  it('GET /auth/staff/registration/:token should validate staff invite', () => {
    return request(app.getHttpServer())
      .get('/auth/staff/registration/some-token')
      .expect(200)
      .then(res => {
          expect(res.body).toEqual({
            success: true,
            data: {
              valid: true,
              email: 'staff@test.com',
              salonId: 'salon1',
            }
          });
      });
  });

  it('POST /auth/staff/registration/complete should complete staff registration', () => {
    return request(app.getHttpServer())
      .post('/auth/staff/registration/complete')
      .send({ token: 'some-token', password: 'password' })
      .expect(201)
      .then(res => {
        expect(res.body).toEqual({ success: true, data: {} });
      });
  });

  it('POST /auth/staff/registration/complete should handle MFA branch', () => {
    jest.spyOn(authService, 'completeStaffRegistration').mockResolvedValue({ next: 'mfa' });
    return request(app.getHttpServer())
      .post('/auth/staff/registration/complete')
      .send({ token: 'some-token', password: 'password' })
      .expect(201)
      .then(res => {
        expect(res.body).toEqual({ success: true, data: { next: 'mfa' } });
      });
  });
});