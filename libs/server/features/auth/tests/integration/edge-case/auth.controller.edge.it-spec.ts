import { AuthController } from '../../../src/lib/controllers/auth.controller';
import type { AuthService } from '../../../src/lib/services/auth.service';
import type { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import type { AuditService } from '../../../src/lib/services/audit.service';
import type { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

/**
 * Exercise AuthController refresh branches not covered by harness-level specs.
 */
describe('AuthController refresh edge branches (integration-style)', () => {
  let controller: AuthController;
  let authSvc: Pick<AuthService, 'signIn' | 'signInWithTotp' | 'refreshToken' | 'logout'>;
  let cookies: Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>;
  let audit: Pick<AuditService, 'log'>;
  let jwt: Pick<JwtService, 'decode'>;
  let decodeMock: jest.Mock;

  beforeAll(() => {
    authSvc = {
      signIn: jest.fn(),
      signInWithTotp: jest.fn(),
      refreshToken: jest.fn(async () => ({ accessToken: 'AT', refreshToken: 'RT' })),
      logout: jest.fn(async () => undefined),
    };
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() };
    audit = { log: jest.fn() };
    decodeMock = jest.fn(() => ({ roles: [] }));
    jwt = { decode: decodeMock as unknown as JwtService['decode'] };
    controller = new AuthController(
      authSvc as unknown as import('../../../src/lib/services/auth.service').AuthService,
      cookies as unknown as import('../../../src/lib/services/auth-cookies.service').AuthCookiesService,
      audit as unknown as import('../../../src/lib/services/audit.service').AuditService,
      jwt as unknown as JwtService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when both cookie and body refresh token are provided', async () => {
    await expect(
      controller.refresh(
        { refreshToken: 'body-token' } as unknown as import('../../../src/lib/dto/refresh-token.dto').RefreshTokenDto,
        { headers: { cookie: 'bsaas_rt=from-cookie' } } as unknown as import('express').Request,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(audit.log).toHaveBeenCalledWith('refresh_both_tokens_provided', { hasCookie: true, hasBody: true });
    expect(authSvc.refreshToken).not.toHaveBeenCalled();
  });

  it('rejects when both cookie and body token are missing', async () => {
    await expect(
      controller.refresh(
        { refreshToken: undefined } as unknown as import('../../../src/lib/dto/refresh-token.dto').RefreshTokenDto,
        { headers: {} } as unknown as import('express').Request,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(authSvc.refreshToken).not.toHaveBeenCalled();
  });

  it('isCustomerFromAccess returns false for undefined token', () => {
    const probe = (controller as unknown as { isCustomerFromAccess: (t?: string) => boolean }).isCustomerFromAccess;
    expect(probe.call(controller, undefined)).toBe(false);
  });

  it('isCustomerFromAccess returns false when roles do not include CUSTOMER', () => {
    decodeMock.mockReturnValueOnce({ roles: ['ADMIN'] });
    const probe = (controller as unknown as { isCustomerFromAccess: (t?: string) => boolean }).isCustomerFromAccess;
    expect(probe.call(controller, 'any')).toBe(false);
  });
});
