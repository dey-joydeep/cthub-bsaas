import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import { CsrfGuard, JwtAuthGuard, CookieRegistry, CookiesInterceptor } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from '../../src/lib/services/auth-cookies.service';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../../src/lib/services/auth.service';

class AllowAllJwtGuard {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user?: { userId: string; sessionId: string; email: string; roles: string[] } }>();
    req.user = { userId: 'u1', sessionId: 's1', email: 't@example.com', roles: [] };
    return true;
  }
}

describe('AuthController CSRF (integration)', () => {
  let app: INestApplication;
  // No repository usage in this integration: controller calls mocked service only.

  beforeAll(async () => {
    let builder = Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AuthController],
      providers: [
        { provide: APP_GUARD, useClass: CsrfGuard },
        { provide: APP_GUARD, useClass: AllowAllJwtGuard },
        CookieRegistry,
        CookiesInterceptor,
        AuthCookiesService,
        // Provide minimal AuthService focused on endpoints used in test
        {
          provide: AuthService,
          useValue: {
            listSessions: async () => [],
            revokeSession: async () => ({ success: true }),
            refreshToken: async () => ({ accessToken: 'a1', refreshToken: 'r1' }),
          },
        },
        // Satisfy constructor injections for controller
        { provide: WEB_AUTHN_PORT, useValue: {} },
        { provide: RECOVERY_CODES_PORT, useValue: {} },
        { provide: OAUTH_PORT, useValue: { start: async () => ({ redirectUrl: 'x' }) } },
      ],
    });

    builder = builder.overrideGuard(JwtAuthGuard).useClass(AllowAllJwtGuard);

    const moduleRef = await builder.compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects POST without XSRF header when cookie is set', async () => {
    const agent = request(app.getHttpServer());
    await agent
      .post('/auth/sessions/revoke/abc')
      .set('Cookie', ['XSRF-TOKEN=t1'])
      .expect(403);
  });

  it('accepts POST when header matches XSRF cookie', async () => {
    const agent = request(app.getHttpServer());
    await agent
      .post('/auth/sessions/revoke/abc')
      .set('Cookie', ['XSRF-TOKEN=t2'])
      .set('X-XSRF-TOKEN', 't2')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ success: true, data: { success: true } });
      });
  });

  it('rejects POST /auth/refresh without XSRF header when cookie is set', async () => {
    const agent = request(app.getHttpServer());
    await agent
      .post('/auth/refresh')
      .send({ refreshToken: 'dummy' })
      .set('Cookie', ['XSRF-TOKEN=t3'])
      .expect(403);
  });

  it('accepts POST /auth/refresh when header matches XSRF cookie', async () => {
    const agent = request(app.getHttpServer());
    await agent
      .post('/auth/refresh')
      .send({ refreshToken: 'dummy' })
      .set('Cookie', ['XSRF-TOKEN=t4'])
      .set('X-XSRF-TOKEN', 't4')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ success: true, data: {} });
      });
  });
});
