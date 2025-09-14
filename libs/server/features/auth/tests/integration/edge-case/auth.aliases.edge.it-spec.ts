import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { CookieRegistry, CookiesInterceptor, JwtAuthGuard } from '@cthub-bsaas/server-core';
import type { ExecutionContext } from '@nestjs/common';

describe('Auth alias routes (edge-case)', () => {
  let app: INestApplication | undefined;

  class SetUserGuard {
    canActivate(ctx: ExecutionContext): boolean {
      const req = ctx.switchToHttp().getRequest();
      req.user = { userId: 'u1' };
      return true;
    }
  }

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { revokeSession: async () => ({ success: true as const }), unlinkSocialAccount: async () => {}, listSessions: async () => [] } },
        { provide: WEB_AUTHN_PORT, useValue: {} },
        { provide: RECOVERY_CODES_PORT, useValue: { generate: async () => ['a', 'b'], verifyAndConsume: async () => true } },
        { provide: OAUTH_PORT, useValue: { start: async () => ({ redirectUrl: 'x' }) } },
        { provide: (await import('@nestjs/config')).ConfigService, useValue: { get: () => undefined } },
        CookieRegistry,
        CookiesInterceptor,
        (await import('../../../src/lib/services/auth-cookies.service')).AuthCookiesService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(SetUserGuard)
      .compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => { if (app) await app.close(); });

  it('GET /auth/sessions returns list', async () => {
    const req = (await import('supertest')).default(app!.getHttpServer());
    await req.get('/auth/sessions').expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.any(Array) });
    });
  });

  it('GET /auth/devices returns list (alias)', async () => {
    const req = (await import('supertest')).default(app!.getHttpServer());
    await req.get('/auth/devices').expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.any(Array) });
    });
  });

  it('POST /auth/recovery-codes/issue returns 201', async () => {
    const req = (await import('supertest')).default(app!.getHttpServer());
    await req.post('/auth/recovery-codes/issue').expect(201).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.any(Array) });
    });
  });

  it('POST /auth/recovery-codes/verify returns {success:true}', async () => {
    const req = (await import('supertest')).default(app!.getHttpServer());
    await req.post('/auth/recovery-codes/verify').send({ code: 'abc' }).expect(200).expect({ success: true, data: { success: true } });
  });

  it('POST /auth/devices/revoke returns {success:true}', async () => {
    const req = (await import('supertest')).default(app!.getHttpServer());
    await req.post('/auth/devices/revoke').send({ id: 's1' }).expect(200).expect({ success: true, data: { success: true } });
  });

  it('DELETE /auth/sessions/:id returns {success:true}', async () => {
    const req = (await import('supertest')).default(app!.getHttpServer());
    await req.delete('/auth/sessions/s1').expect(200).expect({ success: true, data: { success: true } });
  });

  it('DELETE /auth/oauth/google returns {success:true}', async () => {
    const req = (await import('supertest')).default(app!.getHttpServer());
    await req.delete('/auth/oauth/google').expect(200).expect({ success: true, data: { success: true } });
  });
});
