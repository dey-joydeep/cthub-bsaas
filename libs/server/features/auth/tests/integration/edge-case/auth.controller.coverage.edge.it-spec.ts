import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import {
  WEB_AUTHN_PORT,
  RECOVERY_CODES_PORT,
  OAUTH_PORT,
  WebAuthnPort,
  RecoveryCodesPort,
  OAuthPort,
} from '@cthub-bsaas/server-contracts-auth';
import { CookieRegistry, CookiesInterceptor, JwtAuthGuard } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController coverage (edge-case direct calls)', () => {
  let app: INestApplication;
  const authSvc: Partial<AuthService> = {};
  const webAuthn: Partial<WebAuthnPort> = {};
  const recovery: Partial<RecoveryCodesPort> = {};
  const oauth: Partial<OAuthPort> = {};

  beforeAll(async () => {
    Object.assign(authSvc, {
      signIn: async (email: string) =>
        email === 'totp@example.com'
          ? ({ totpRequired: true as const, tempToken: 'tmp' })
          : ({ totpRequired: false as const, accessToken: 'AT', refreshToken: 'RT' }),
      refreshToken: async (tok: string) => (tok === 'no-rt' ? ({ accessToken: 'AT2' } as unknown as { accessToken: string }) : ({ accessToken: 'AT2', refreshToken: 'RT2' })),
      logout: async () => {},
      listSessions: async () => [],
      revokeSession: async () => ({ success: true as const }),
      requestPasswordReset: async () => {},
      resetPassword: async () => {},
      requestEmailVerification: async () => {},
      verifyEmail: async () => {},
      verifyEmailOtp: async () => {},
      issueTokensForUser: async () => ({ accessToken: 'AT3', refreshToken: 'RT3' }),
      resolveUserIdByEmail: async () => 'u1',
      linkSocialAccount: async () => {},
      signInWithSocial: async () => ({ accessToken: 'AT4', refreshToken: 'RT4' }),
      unlinkSocialAccount: async () => {},
      register: async () => {},
    } as Partial<AuthService>);

    Object.assign(webAuthn, (
      {
        startRegistration: async () => ({ rp: 'x' } as Record<string, unknown>),
        finishRegistration: async () => ({ credentialId: 'cid', counter: 0 }),
        startAuthentication: async () => ({ challenge: 'c' } as Record<string, unknown>),
        finishAuthentication: async () => ({ credentialId: 'cid', counter: 1 } as Record<string, unknown>),
      } as unknown
    ) as Partial<WebAuthnPort>);

    Object.assign(recovery, {
      generate: async () => ['r1', 'r2'],
      verifyAndConsume: async () => true,
    } as Partial<RecoveryCodesPort>);

    Object.assign(oauth, {
      exchangeCode: async () => ({ provider: 'google', providerUserId: 'pid' }),
      start: async () => ({ redirectUrl: 'x' }),
    } as Partial<OAuthPort>);

    const testingModuleBuilder = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: WEB_AUTHN_PORT, useValue: webAuthn },
        { provide: RECOVERY_CODES_PORT, useValue: recovery },
        { provide: OAUTH_PORT, useValue: oauth },
        { provide: ConfigService, useValue: { get: () => undefined } },
        CookieRegistry,
        CookiesInterceptor,
        AuthCookiesService,
      ],
    });
    class SetUserGuard { canActivate(ctx: ExecutionContext) { const r = ctx.switchToHttp().getRequest<{ user?: { userId: string; sessionId: string } }>(); if (!r.user) r.user = { userId: 'u1', sessionId: 's1' }; return true; } }
    const mod = await testingModuleBuilder.overrideGuard(JwtAuthGuard).useClass(SetUserGuard as unknown as typeof JwtAuthGuard).compile();
    app = mod.createNestApplication();
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

  it('covers login branches (HTTP)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/login').send({ email: 'ok@example.com', password: 'p' }).expect(200);
    const r2 = await req.post('/auth/login').send({ email: 'totp@example.com', password: 'p' }).expect(200);
    expect(r2.body).toEqual({ totpRequired: true, tempToken: 'tmp' });
  });

  it('covers refresh branches (HTTP)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    // cookie-only branch is exercised in other tests; cover body paths here
    await req.post('/auth/refresh').send({ refreshToken: 'from-body' }).expect(200);
    await req.post('/auth/refresh').send({ refreshToken: 'no-rt' }).expect(200);
    await req
      .post('/auth/refresh')
      .set('Cookie', ['bsaas_rt=a%3Db'])
      .send({ refreshToken: 'IGNORED' })
      .expect(200);
    // cover right side of (k === 'bsaas_rt' || k === 'refreshToken')
    await req
      .post('/auth/refresh')
      .set('Cookie', ['refreshToken=a%2Fb'])
      .send({ refreshToken: 'IGNORED' })
      .expect(200);
    // cookie header present but unrelated; body token covers success while scanner sees false branch at least once
    await req
      .post('/auth/refresh')
      .set('Cookie', ['foo=bar'])
      .send({ refreshToken: 'from-body-3' })
      .expect(200);
    await req.post('/auth/refresh').expect(400);
    await req.post('/auth/refresh').set('Cookie', ['refreshToken=']).expect(400);
    await req.post('/auth/refresh').set('Cookie', ['bsaas_rt=']).expect(400);
    // scanning case is covered via typical single-cookie inputs above
  });

  it('covers refresh missing token throw (direct call)', async () => {
    const ctrl = app.get(AuthController);
    await expect(ctrl.refresh({} as unknown as import('../../../src/lib/dto/refresh-token.dto').RefreshTokenDto, { headers: {} } as unknown as import('express').Request)).rejects.toBeTruthy();
  });

  it('covers refresh cookie scan false branch (direct call)', async () => {
    const ctrl = app.get(AuthController);
    const req = { headers: { cookie: 'foo=bar; XSRF-TOKEN=z' } } as unknown as import('express').Request;
    await expect(ctrl.refresh({} as unknown as import('../../../src/lib/dto/refresh-token.dto').RefreshTokenDto, req)).rejects.toBeTruthy();
  });


  it('covers logout and sessions (HTTP)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/logout').expect(200);
    await req.get('/auth/sessions').expect(200);
    await req.post('/auth/sessions/revoke/sid').expect(200);
    await req.post('/auth/sessions/revoke').send({ id: 'sid' }).expect(200);
  });

  it('covers recovery, email, customer register, oauth (HTTP)', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/password/forgot').send({ email: 'e@example.com' }).expect(202);
    await req.post('/auth/password/reset').send({ token: 't', newPassword: 'Abcd1234!' }).expect(200);
    await req.post('/auth/email/send-verification').send({ email: 'e@example.com' }).expect(202);
    await req.post('/auth/email/verify').send({ token: 't' }).expect(200);
    await req.post('/auth/email/verify/request').send({ email: 'e' }).expect(202);
    await req.post('/auth/email/verify/confirm').send({ token: 't' }).expect(200);
    await req.post('/auth/email/verify/confirm').send({ email: 'e', otp: '123456' }).expect(200);
    await req.post('/auth/email/verify/confirm').send({}).expect(400);
    await req.get('/auth/oauth/google/callback').query({ code: 'c' }).expect(200);
    await req.post('/auth/oauth/google/unlink').expect(200);
    await req.post('/auth/register').send({ email: 'e@example.com', password: 'Password#1' }).expect(201);
  });

  it('covers webauthn flows', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    await req.post('/auth/webauthn/register/start').send({ username: 'x' }).expect(200);
    await req.post('/auth/webauthn/register/finish').send({ response: {} }).expect(200);
    await req.post('/auth/webauthn/login/start').send({}).expect(400);
    await req.post('/auth/webauthn/login/start').send({ email: 'e' }).expect(200);
    await req.post('/auth/webauthn/login/start').send({ userId: 'u1' }).expect(200);
    await req.post('/auth/webauthn/login/finish').send({ response: {} }).expect(200);
  });

  it('covers webauthn login start default param branches (direct call)', async () => {
    const controller = app.get(AuthController);
    await expect(controller.webauthnLoginStart(undefined as unknown as { email?: string; userId?: string }, undefined as unknown as { user?: { userId: string } })).rejects.toBeTruthy();
  });
});
