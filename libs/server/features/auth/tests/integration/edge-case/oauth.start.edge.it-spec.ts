import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../../../src/lib/controllers/auth.controller';
import { AuthService } from '../../../src/lib/services/auth.service';
import { OAUTH_PORT, OAuthPort, WEB_AUTHN_PORT, RECOVERY_CODES_PORT } from '@cthub-bsaas/server-contracts-auth';
import { ConfigService } from '@nestjs/config';
import { CookieRegistry, CookiesInterceptor } from '@cthub-bsaas/server-core';
import { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';

describe('OAuth start (edge-case)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: WEB_AUTHN_PORT, useValue: {} },
        { provide: RECOVERY_CODES_PORT, useValue: { generate: jest.fn(), verifyAndConsume: jest.fn() } },
        {
          provide: OAUTH_PORT,
          useValue: {
            start: async (provider: string) => ({ redirectUrl: `https://example.com/${provider}` }),
          } as Pick<OAuthPort, 'start'>,
        },
        CookieRegistry,
        CookiesInterceptor,
        AuthCookiesService,
      ],
    }).compile();
    app = modRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/oauth/google/start responds with 302 and Location', async () => {
    const req = (await import('supertest')).default(app.getHttpServer());
    const res = await req.get('/auth/oauth/google/start').expect(302);
    expect(res.header.location).toBe('https://example.com/google');
  });
});
