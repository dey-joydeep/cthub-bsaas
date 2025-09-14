import { Test } from '@nestjs/testing';
import { AuthController } from '../../src/lib/controllers/auth.controller';
import { AuthService } from '../../src/lib/services/auth.service';
import { AuthCookiesService } from '../../src/lib/services/auth-cookies.service';
import { WEB_AUTHN_PORT, RECOVERY_CODES_PORT, OAUTH_PORT } from '@cthub-bsaas/server-contracts-auth';
import { CookieRegistry, CookiesInterceptor } from '@cthub-bsaas/server-core';
import { APP_INTERCEPTOR } from '@nestjs/core';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: AuthCookiesService, useValue: {} },
        { provide: WEB_AUTHN_PORT, useValue: {} },
        { provide: RECOVERY_CODES_PORT, useValue: {} },
        { provide: OAUTH_PORT, useValue: {} },
        CookieRegistry,
        {
          provide: APP_INTERCEPTOR,
          useClass: CookiesInterceptor,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
