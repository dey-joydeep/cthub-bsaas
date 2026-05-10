import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import { CookieRegistry, CookiesInterceptor, JwtAuthGuard } from '@cthub-bsaas/server-core';
import type { ExecutionContext } from '@nestjs/common';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';

class SetUserGuard { canActivate(ctx: ExecutionContext) { const r = ctx.switchToHttp().getRequest<{ user?: { userId: string } }>(); r.user = { userId: 'u1' }; return true; } }

describe('Password change (edge-case)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: { changePassword: async () => {} } },
        { provide: (await import('@nestjs/config')).ConfigService, useValue: { get: () => undefined } },
        { provide: WEB_AUTHN_PORT, useValue: {} },
        { provide: RECOVERY_CODES_PORT, useValue: {} },
        { provide: OAUTH_PORT, useValue: { start: async () => ({ redirectUrl: 'x' }) } },
        CookieRegistry,
        CookiesInterceptor,
        (await import('../../../src/lib/services/auth-cookies.service')).AuthCookiesService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(SetUserGuard as unknown as typeof JwtAuthGuard)
      .compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('POST /auth/password/change returns success', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/password/change').send({ currentPassword: 'Old#1', newPassword: 'New#1Password' }).expect(200).expect({ success: true });
  });

  it('POST /auth/password/change returns 400 on service error', async () => {
    const svc = app.get(AuthService) as { changePassword: (a: string, b: string, c: string) => Promise<void> };
    (svc.changePassword as unknown as jest.Mock) = jest.fn(async () => { throw new (await import('@nestjs/common')).BadRequestException(); });
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/password/change').send({ currentPassword: 'x', newPassword: 'New#1Password' }).expect(400);
  });
});
