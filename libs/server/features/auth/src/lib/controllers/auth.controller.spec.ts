import { AuthController } from './auth.controller';
import type { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import type { Request as ExpressRequest } from 'express';
import type { JwtService } from '@nestjs/jwt';

describe('AuthController (core endpoints)', () => {
  let controller: AuthController;
  let service: jest.Mocked<Pick<AuthService, 'signIn' | 'signInWithTotp' | 'refreshToken' | 'logout'>>;
  let cookies: jest.Mocked<Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>>;
  let jwt: Pick<JwtService, 'decode'>;
  let decodeMock: jest.Mock;

  const createLoginDto = (overrides: Partial<LoginDto> = {}): LoginDto =>
    Object.assign(new LoginDto(), { email: 'e@example.com', password: 'Password#1', ...overrides });

  const createRefreshDto = (overrides: Partial<RefreshTokenDto> = {}): RefreshTokenDto => Object.assign(new RefreshTokenDto(), overrides);

  const reqWithCookie = (cookieHeader?: string): ExpressRequest =>
    ({ headers: cookieHeader ? { cookie: cookieHeader } : {} }) as unknown as ExpressRequest;

  beforeEach(() => {
    service = {
      signIn: jest.fn().mockResolvedValue({ totpRequired: false, accessToken: 'AT', refreshToken: 'RT' }),
      signInWithTotp: jest.fn().mockResolvedValue({ accessToken: 'AT2', refreshToken: 'RT2' }),
      refreshToken: jest.fn().mockResolvedValue({ accessToken: 'NAT', refreshToken: 'NRT' }),
      logout: jest.fn().mockResolvedValue(undefined),
    } as unknown as typeof service;
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() } as unknown as typeof cookies;
    decodeMock = jest.fn(() => ({ roles: ['CUSTOMER'] }));
    jwt = { decode: decodeMock as unknown as JwtService['decode'] };
    // AuditService is not used by tests; pass a minimal stub
    controller = new AuthController(
      service as unknown as AuthService,
      cookies as unknown as AuthCookiesService,
      { log: jest.fn() } as unknown as import('../services/audit.service').AuditService,
      jwt as unknown as JwtService,
    );
  });

  it('signIn sets CSRF and auth cookies when no TOTP', async () => {
    const userSummary = {
      id: 'u1',
      email: 'e@example.com',
      roles: ['STAFF'],
      canManageBranches: true,
      managedBranchIds: ['b1'],
    };
    service.signIn.mockResolvedValue({
      totpRequired: false,
      accessToken: 'at',
      refreshToken: 'rt',
      user: userSummary,
    });
    const result = await controller.signIn(createLoginDto());
    expect(result).toEqual({ totpRequired: false, user: userSummary });
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'at', refreshToken: 'rt' }),
      expect.any(Object),
    );
  });

  it('signIn returns temp token when TOTP required', async () => {
    service.signIn.mockResolvedValue({ totpRequired: true, tempToken: 'temp' });
    const result = await controller.signIn(createLoginDto());
    expect(result).toEqual({ totpRequired: true, tempToken: 'temp' });
  });

  it('login/totp issues cookies', async () => {
    const out = await controller.signInWithTotp({ tempToken: 't', totpCode: '123456' });
    expect(out).toEqual({ user: undefined });
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'AT2', refreshToken: 'RT2' }),
      expect.any(Object),
    );
  });

  it('login/totp uses default TTL path when roles are not CUSTOMER', async () => {
    decodeMock.mockReturnValueOnce({ roles: [] });
    const out = await controller.signInWithTotp({ tempToken: 't', totpCode: '123456' });
    expect(out).toEqual({ user: undefined });
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('login/totp handles decode null safely', async () => {
    decodeMock.mockReturnValueOnce(null);
    const out = await controller.signInWithTotp({ tempToken: 't', totpCode: '123456' });
    expect(out).toEqual({ user: undefined });
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('me returns current user profile and capabilities from jwt context', () => {
    const userContext = {
      userId: 'u1',
      email: 'e@example.com',
      roles: ['STAFF'],
      sessionId: 'sess-1',
      tenantId: 'tenant-1',
      managedBranchIds: ['b1'],
      canManageBranches: true,
    };
    const result = controller.me({ user: userContext as any });
    expect(result).toEqual({
      id: 'u1',
      email: 'e@example.com',
      roles: ['STAFF'],
      tenantId: 'tenant-1',
      managedBranchIds: ['b1'],
      canManageBranches: true,
    });
  });

  it('refresh uses cookie token and rotates cookies', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });
    const res = await controller.refresh(createRefreshDto(), reqWithCookie('bsaas_rt=old'));
    expect(res).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'new-at', refreshToken: 'new-rt' }),
      expect.any(Object),
    );
  });

  it('refresh falls back to body token when no cookie', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'at2', refreshToken: 'rt2' });
    const res = await controller.refresh(createRefreshDto({ refreshToken: 'from-body' }), reqWithCookie());
    expect(res).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'at2', refreshToken: 'rt2' }),
      expect.any(Object),
    );
  });

  it('refresh rejects when both cookie and body tokens are provided', async () => {
    await expect(controller.refresh(createRefreshDto({ refreshToken: 'from-body' }), reqWithCookie('bsaas_rt=cookie'))).rejects.toThrow();
    expect(cookies.rotateOnRefresh).not.toHaveBeenCalled();
  });

  it('refresh throws when no token provided', async () => {
    await expect(controller.refresh(createRefreshDto(), reqWithCookie())).rejects.toThrow();
  });

  it('logout clears cookies and calls service', async () => {
    await controller.logout({ user: { sessionId: 's1' } });
    expect(service.logout).toHaveBeenCalledWith('s1');
    expect(cookies.clear).toHaveBeenCalled();
  });

  it('isCustomerFromAccess returns false on missing token (early return)', () => {
    expect((controller as unknown as { isCustomerFromAccess: (t?: string) => boolean }).isCustomerFromAccess(undefined)).toBe(false);
  });
});
