import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import type { WebAuthnPort, RecoveryCodesPort } from '@cthub-bsaas/server-contracts-auth';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import { CookieRegistry, CookiesInterceptor, RetryAfterFilter, ConfigModule } from '@cthub-bsaas/server-core';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../../src/lib/strategies/jwt.strategy';

describe('Rate limiting (edge-case)', () => {
  let app: INestApplication;
  let webAuthn: jest.Mocked<Pick<WebAuthnPort, 'startAuthentication'>>;
  const authSvc = {
    signIn: jest.fn(async () => ({ totpRequired: false, accessToken: 'AT', refreshToken: 'RT' })),
    resolveUserIdByEmail: jest.fn(async () => 'user-1'),
  } as unknown as jest.Mocked<Pick<AuthService, 'signIn' | 'resolveUserIdByEmail'>>;

  beforeAll(async () => {
    webAuthn = {
      startAuthentication: jest.fn(async (userId: string) => {
        void userId;
        return { challenge: 'c' } as unknown as import('@cthub-bsaas/server-contracts-auth').RequestOptionsJSON;
      }),
    } as unknown as typeof webAuthn;
    const modRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 1, limit: 1 }] }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authSvc },
        { provide: WEB_AUTHN_PORT, useValue: webAuthn },
        { provide: RECOVERY_CODES_PORT, useValue: { generate: jest.fn(async () => ['r1']), verifyAndConsume: jest.fn(async () => true) } as RecoveryCodesPort },
        { provide: OAUTH_PORT, useValue: { start: async () => ({ redirectUrl: 'x' }) } },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_FILTER, useClass: RetryAfterFilter },
        CookieRegistry,
        CookiesInterceptor,
        AuthCookiesService,
        JwtStrategy,
      ],
    }).compile();
    app = modRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    try {
      const storage = app.get(ThrottlerStorageService) as unknown;
      const extended = storage as {
        reset?: () => void | Promise<void>;
        storage?: Map<unknown, unknown>;
        timeoutIds?: Map<string, NodeJS.Timeout[]>;
      };
      if (typeof extended.reset === 'function') {
        await Promise.resolve(extended.reset());
      } else {
        if (extended.storage instanceof Map) {
          extended.storage.clear();
        }
        if (extended.timeoutIds instanceof Map) {
          extended.timeoutIds.forEach((timeouts: NodeJS.Timeout[]) => {
            timeouts.forEach((timeout) => clearTimeout(timeout));
          });
          extended.timeoutIds.clear();
        }
      }
    } catch {
      // Guard not registered; ignore.
    }
  });

  it('POST /auth/login returns 429 when exceeding method-level limit', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    // login has @Throttle limit 5 → perform 6 calls
    for (let i = 0; i < 5; i++) {
      await req.post('/auth/login').send({ email: 'e@example.com', password: 'p' }).expect(200);
    }
    const res = await req.post('/auth/login').send({ email: 'e@example.com', password: 'p' }).expect(429);
    expect(res.header['retry-after']).toBeDefined();
  });

  it('POST /auth/webauthn/login/start returns 429 when exceeding method-level limit', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    // webauthn start has @Throttle limit 10 → perform 11 calls
    for (let i = 0; i < 10; i++) {
      await req.post('/auth/webauthn/login/start').send({ email: 'e@example.com' }).expect(200);
    }
    const res = await req.post('/auth/webauthn/login/start').send({ email: 'e@example.com' }).expect(429);
    expect(res.header['retry-after']).toBeDefined();
  });
});
