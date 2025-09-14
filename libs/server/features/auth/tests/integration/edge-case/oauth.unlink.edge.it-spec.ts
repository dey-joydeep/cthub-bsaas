import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import { ConfigService } from '@nestjs/config';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { JwtAuthGuard, CookieRegistry, CookiesInterceptor } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import type { ExecutionContext } from '@nestjs/common';

class SetUserGuard {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    req.user = { userId: 'u1' };
    return true;
  }
}

describe('OAuth unlink (edge-case)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { unlinkSocialAccount: async () => {} } },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: WEB_AUTHN_PORT, useValue: {} },
        { provide: RECOVERY_CODES_PORT, useValue: {} },
        { provide: OAUTH_PORT, useValue: { start: async () => ({ redirectUrl: 'x' }) } },
        CookieRegistry,
        CookiesInterceptor,
        AuthCookiesService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(SetUserGuard)
      .compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  it('POST /auth/oauth/google/unlink returns {success:true}', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    const res = await req.post('/auth/oauth/google/unlink').send({}).expect(200);
    expect(res.body).toEqual({ success: true, data: { success: true } });
  });
});
