import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import type { WebAuthnPort, RecoveryCodesPort } from '@cthub-bsaas/server-contracts-auth';
import { CookieRegistry, CookiesInterceptor, JwtAuthGuard } from '@cthub-bsaas/server-core';

describe('AuthController additional (integration-light)', () => {
  let app: INestApplication;
  type AuthSvcMock = jest.Mocked<
    Pick<
      AuthService,
      | 'refreshToken'
      | 'logout'
      | 'listSessions'
      | 'revokeSession'
      | 'signInWithTotp'
      | 'requestPasswordReset'
      | 'resetPassword'
      | 'requestEmailVerification'
      | 'verifyEmail'
      | 'signIn'
      | 'verifyEmailOtp'
      | 'issueTokensForUser'
      | 'resolveUserIdByEmail'
      | 'register'
    >
  >;
  const authSvc: AuthSvcMock = {
    refreshToken: (jest.fn(async () => ({ accessToken: 'at2', refreshToken: 'rt2' })) as unknown) as AuthSvcMock['refreshToken'],
    logout: (jest.fn(async () => {}) as unknown) as AuthSvcMock['logout'],
    listSessions: (jest.fn(async () => []) as unknown) as AuthSvcMock['listSessions'],
    revokeSession: jest.fn(async (u: string, s: string): Promise<{ success: true }> => { void u; void s; return { success: true as const }; }),
    signInWithTotp: (jest.fn(async () => ({ accessToken: 'at', refreshToken: 'rt' })) as unknown) as AuthSvcMock['signInWithTotp'],
    requestPasswordReset: (jest.fn(async () => {}) as unknown) as AuthSvcMock['requestPasswordReset'],
    resetPassword: (jest.fn(async () => {}) as unknown) as AuthSvcMock['resetPassword'],
    requestEmailVerification: (jest.fn(async () => {}) as unknown) as AuthSvcMock['requestEmailVerification'],
    verifyEmail: (jest.fn(async () => {}) as unknown) as AuthSvcMock['verifyEmail'],
    signIn: jest.fn(),
    verifyEmailOtp: (jest.fn(async () => {}) as unknown) as AuthSvcMock['verifyEmailOtp'],
    issueTokensForUser: (jest.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })) as unknown) as AuthSvcMock['issueTokensForUser'],
    resolveUserIdByEmail: (jest.fn(async (e: string) => { void e; return 'u-by-email'; }) as unknown) as AuthSvcMock['resolveUserIdByEmail'],
    register: (jest.fn(async () => {}) as unknown) as AuthSvcMock['register'],
  };

  beforeAll(async () => {
    const webAuthn: jest.Mocked<Pick<WebAuthnPort, 'startRegistration' | 'finishRegistration' | 'startAuthentication' | 'finishAuthentication'>> = {
      startRegistration: jest.fn(async (u: string, n: string) => {
        void u; void n; return { challenge: 'c' } as Record<string, unknown>;
      }),
      finishRegistration: jest.fn(async (u: string, r: Record<string, unknown>) => {
        void u; void r; return { credentialId: 'cid', counter: 0 };
      }),
      startAuthentication: jest.fn(async (u: string) => { void u; return { challenge: 'c2' } as Record<string, unknown>; }),
      finishAuthentication: jest.fn(async (u: string, r: Record<string, unknown>) => { void u; void r; return { credentialId: 'cid', counter: 1 }; }),
    };
    const recovery: Pick<RecoveryCodesPort, 'generate' | 'verifyAndConsume'> = {
      generate: async (userId: string, count?: number) => { void userId; void count; return ['r1', 'r2']; },
      verifyAndConsume: async (userId: string, code: string) => { void userId; void code; return true; },
    };
    const testingModuleBuilder = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: (await import('@nestjs/config')).ConfigService, useValue: { get: () => undefined } },
        { provide: AuthService, useValue: authSvc },
        { provide: WEB_AUTHN_PORT, useValue: webAuthn },
        { provide: RECOVERY_CODES_PORT, useValue: recovery },
        { provide: OAUTH_PORT, useValue: { start: async () => ({ redirectUrl: 'x' }) } },
        CookieRegistry,
        CookiesInterceptor,
        (await import('../../../src/lib/services/auth-cookies.service')).AuthCookiesService,
      ],
    });
    class SetUserGuard {
      canActivate(ctx: ExecutionContext) {
        const r = ctx.switchToHttp().getRequest<{ user?: { userId: string; sessionId: string } }>();
        if (!r.user) r.user = { userId: 'u1', sessionId: 's1' };
        return true;
      }
    }
    const moduleRef = await testingModuleBuilder.overrideGuard(JwtAuthGuard).useClass(SetUserGuard as unknown as typeof JwtAuthGuard).compile();
    app = moduleRef.createNestApplication();
    app.use((req: { path?: string; user?: { userId: string; sessionId: string } }, _res: unknown, next: () => void) => {
      if ((req.path as string).startsWith('/auth/webauthn/login/finish') || (req.path as string).startsWith('/auth/webauthn/register/')) {
        if (!req.user) req.user = { userId: 'u1', sessionId: 's1' };
      }
      next();
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('handles login/totp endpoint', async () => {
    const res = await (await import('supertest')).default(app.getHttpServer())
      .post('/auth/login/totp')
      .send({ tempToken: 'a.b.c', totpCode: '123456' })
      .expect(200);
    expect(res.body).toEqual({ success: true });
  });

  it('login sets temp token branch (no cookies)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    // Override signIn to simulate TOTP-required response
    authSvc.signIn = (jest.fn(async () => ({ totpRequired: true as const, tempToken: 'tmp' })) as unknown) as typeof authSvc.signIn;
    const res = await req.post('/auth/login').send({ email: 'e@example.com', password: 'p' }).expect(200);
    expect(res.body).toEqual({ success: true, data: { totpRequired: true, tempToken: 'tmp' } });
  });

  it('login success sets cookies (non-TOTP)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    authSvc.signIn = (jest.fn(async () => ({ totpRequired: false as const, accessToken: 'AT', refreshToken: 'RT' })) as unknown) as typeof authSvc.signIn;
    const res = await req.post('/auth/login').send({ email: 'e@example.com', password: 'p' }).expect(200);
    const sc = res.get('set-cookie') as unknown;
    const cookieStr = Array.isArray(sc) ? (sc as string[]).join(';') : String(sc ?? '');
    expect(cookieStr).toContain('bsaas_at=');
    expect(cookieStr).toContain('bsaas_rt=');
  });

  it('handles password reset request and reset', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/password/forgot').send({ email: 'e@example.com' }).expect(202).expect({ success: true });
    await req.post('/auth/password/reset').send({ token: 't', newPassword: 'N3w!Pass' }).expect(200).expect({ success: true });
  });

  it('handles email verification request and verify', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/email/send-verification').send({ email: 'e@example.com' }).expect(202).expect({ success: true });
    await req.post('/auth/email/verify').send({ token: 't' }).expect(200).expect({ success: true });
  });

  it('handles webauthn login finish (HTTP)', async () => {
    authSvc.issueTokensForUser = (jest.fn(async () => ({ accessToken: 'at3', refreshToken: 'rt3' })) as unknown) as typeof authSvc.issueTokensForUser;
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/webauthn/login/finish').send({ response: {} }).expect(200).expect({ success: true });
  });

  // covered via HTTP tests above

  // recovery branches covered via HTTP above

  // logout covered via HTTP above

  it('email verify confirm branches (HTTP)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/email/verify/confirm').send({ token: 'T' }).expect(200).expect({ success: true });
    await req.post('/auth/email/verify/confirm').send({}).expect(400);
  });

  it('email verify confirm via OTP branch (HTTP)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/email/verify/confirm').send({ email: 'e@example.com', otp: '123456' }).expect(200).expect({ success: true });
  });

  it('register returns 201 and calls service', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/register').send({ email: 'e2@example.com', password: 'Password#1' }).expect(201).expect({ success: true });
  });

  // cookie-based refresh is covered in other refresh tests

  it('refresh without cookie or body returns 400 over HTTP', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/refresh').expect(400);
  });

  it('refresh via HTTP with body sets new refresh cookie (branch)', async () => {
    // Arrange mock to include refreshToken in result
    (authSvc.refreshToken as jest.Mock) = jest.fn(async () => ({ accessToken: 'AT', refreshToken: 'NEW' }));
    const req = (await import('supertest')).default(app.getHttpServer());
    const res = await req.post('/auth/refresh').send({ refreshToken: 'BODYTOKEN' }).expect(200);
    // body path covered; check cookie set branch
    const setCookie = res.get('set-cookie') as unknown;
    const cookieStr = Array.isArray(setCookie) ? (setCookie as string[]).join(';') : String(setCookie ?? '');
    expect(cookieStr).toContain('bsaas_rt=');
  });

  it('refresh via HTTP picks encoded cookie over body (decode branch)', async () => {
    (authSvc.refreshToken as jest.Mock) = jest.fn(async () => ({ accessToken: 'AT2', refreshToken: 'NEW2' }));
    const req = (await import('supertest')).default(app.getHttpServer());
    await req
      .post('/auth/refresh')
      .set('Cookie', ['refreshToken=a%3Db'])
      .send({ refreshToken: 'IGNORED' })
      .expect(200)
      .expect((r) => {
        const sc = r.get('set-cookie') as unknown;
        const cookieStr = Array.isArray(sc) ? (sc as string[]).join(';') : String(sc ?? '');
        expect(cookieStr).toContain('bsaas_rt=');
      });
  });

  it('refresh via HTTP with unrelated cookie falls back to body (loop false branch)', async () => {
    (authSvc.refreshToken as jest.Mock) = jest.fn(async () => ({ accessToken: 'AT3', refreshToken: 'NEW3' }));
    const req = (await import('supertest')).default(app.getHttpServer());
    await req
      .post('/auth/refresh')
      .set('Cookie', ['sid=1'])
      .send({ refreshToken: 'BODY3' })
      .expect(200)
      .expect((r) => {
        const sc = r.get('set-cookie') as unknown;
        const cookieStr = Array.isArray(sc) ? (sc as string[]).join(';') : String(sc ?? '');
        expect(cookieStr).toContain('bsaas_rt=');
      });
  });

  it('refresh via HTTP when service returns no refreshToken (no cookie set branch)', async () => {
    (authSvc.refreshToken as jest.Mock) = jest.fn(async () => ({ accessToken: 'AT4' }));
    const req = (await import('supertest')).default(app.getHttpServer());
    const res = await req
      .post('/auth/refresh')
      .send({ refreshToken: 'BODY4' })
      .expect(200);
    const sc = res.get('set-cookie') as unknown;
    const cookieStr = Array.isArray(sc) ? (sc as string[]).join(';') : String(sc ?? '');
    expect(cookieStr).not.toContain('bsaas_rt=');
  });

  it('refresh via HTTP with empty cookie value returns 400 (v falsy branch)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req
      .post('/auth/refresh')
      .set('Cookie', ['refreshToken='])
      .expect(400);
  });

  // Direct-call refresh branches are covered via HTTP above

  it('covers emailVerifyRequest via HTTP', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/email/verify/request').send({ email: 'e@example.com' }).expect(202);
  });

  it('covers listSessions and revokeSessionBody via HTTP', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.get('/auth/sessions').expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.any(Array) });
    });
    await req.post('/auth/sessions/revoke').send({ id: 's1' }).expect(200).expect({ success: true });
  });

  it('covers revokeSession (path param) and webauthn start defaults', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/sessions/revoke/s1').expect(200).expect({ success: true });
    await req.post('/auth/webauthn/login/start').send({}).expect(400);
  });

  it('handles webauthn register start/finish via HTTP', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/webauthn/register/start').send({ username: 'nick' }).expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.objectContaining({ challenge: expect.any(String) }) });
    });
    await req.post('/auth/webauthn/register/finish').send({ response: {} }).expect(200).expect({ success: true });
  });

  it('webauthn login start via email or userId', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/webauthn/login/start').send({ email: 'e@example.com' }).expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.objectContaining({ challenge: expect.any(String) }) });
    });
    await req.post('/auth/webauthn/login/start').send({ userId: 'u1' }).expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.objectContaining({ challenge: expect.any(String) }) });
    });
  });

  it('recovery generate/codes/verify via HTTP and failure branch', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/recovery/generate').expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.any(Array) });
    });
    await req.post('/auth/recovery/codes').expect(200).expect((r) => {
      expect(r.body).toEqual({ success: true, data: expect.any(Array) });
    });
    await req.post('/auth/recovery/verify').send({ code: 'r1r1r1r1' }).expect(200).expect({ success: true });
    const recoveryProv = app.get(RECOVERY_CODES_PORT) as RecoveryCodesPort & { verifyAndConsume: (u: string, c: string) => Promise<boolean> };
    recoveryProv.verifyAndConsume = async () => false;
    await req.post('/auth/recovery/verify').send({ code: 'badbadbad' }).expect(400);
  });

  it('logout clears cookies over HTTP', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    const res = await req.post('/auth/logout').expect(200);
    const setCookie = res.get('set-cookie') as unknown;
    const cookieStr = Array.isArray(setCookie) ? (setCookie as string[]).join(';') : String(setCookie ?? '');
    expect(cookieStr).toContain('bsaas_rt=');
    expect(cookieStr).toContain('bsaas_at=');
    expect(res.body).toEqual({ success: true });
  });
});
