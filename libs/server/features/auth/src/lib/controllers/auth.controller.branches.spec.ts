import { AuthController } from './auth.controller';
import type { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import type { Request as ExpressRequest } from 'express';

describe('AuthController branches (core)', () => {
  let controller: AuthController;
  let service: jest.Mocked<Pick<
    AuthService,
    'signIn' | 'signInWithTotp' | 'refreshToken' | 'logout'
  >>;
  let cookies: jest.Mocked<Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>>;
  let jwt: { decode: jest.Mock };

  beforeEach(() => {
    service = {
      signIn: jest.fn().mockResolvedValue({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' }),
      signInWithTotp: jest.fn().mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT' }),
      refreshToken: jest.fn().mockResolvedValue({ accessToken: 'A1', refreshToken: 'R1' }),
      logout: jest.fn().mockResolvedValue(undefined),
    } as unknown as typeof service;
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() } as unknown as typeof cookies;
    jwt = { decode: jest.fn(() => ({ roles: ['CUSTOMER'] })) };
    controller = new AuthController(
      service as unknown as AuthService,
      cookies as unknown as AuthCookiesService,
      { log: jest.fn() } as unknown as import('../services/audit.service').AuditService,
      jwt as unknown as any,
    );
  });

  it('signIn branches: non-TOTP and TOTP required', async () => {
    service.signIn.mockResolvedValueOnce({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' });
    const out1 = await controller.signIn({ email: 'e', password: 'p' } as unknown as LoginDto);
    expect(out1).toEqual({ totpRequired: false });
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'at', refreshToken: 'rt' }),
      expect.any(Object),
    );

    service.signIn.mockResolvedValueOnce({ totpRequired: true, tempToken: 'tmp' });
    const out2 = await controller.signIn({ email: 'e', password: 'p' } as unknown as LoginDto);
    expect(out2).toEqual({ totpRequired: true, tempToken: 'tmp' });
  });

  it('refresh branches cover cookie, body, unrelated cookie, and error paths', async () => {
    // cookie present path
    const req1 = { headers: { cookie: 'bsaas_rt=x' } } as unknown as ExpressRequest;
    await controller.refresh({} as RefreshTokenDto, req1);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'A1', refreshToken: 'R1' }),
      expect.any(Object),
    );

    // body token path
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A2', refreshToken: 'R2' });
    const req2 = { headers: {} } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'from-body' } as RefreshTokenDto, req2);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'A2', refreshToken: 'R2' }),
      expect.any(Object),
    );

    // unrelated cookie header, use body
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A3', refreshToken: 'R3' });
    const req3 = { headers: { cookie: 'foo=bar; XSRF-TOKEN=abc' } } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'from-body-2' } as RefreshTokenDto, req3);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'A3', refreshToken: 'R3' }),
      expect.any(Object),
    );

    // service returns undefined -> throw
    service.refreshToken.mockResolvedValueOnce(undefined as unknown as Awaited<ReturnType<AuthService['refreshToken']>>);
    await expect(controller.refresh({ refreshToken: 'body' } as RefreshTokenDto, { headers: {} } as unknown as ExpressRequest)).rejects.toThrow();

    // missing token entirely -> error
    await expect(controller.refresh({} as RefreshTokenDto, { headers: {} } as unknown as ExpressRequest)).rejects.toThrow();

    // empty cookie value -> error
    await expect(controller.refresh({} as RefreshTokenDto, { headers: { cookie: 'bsaas_rt=' } } as unknown as ExpressRequest)).rejects.toThrow();

    // both cookie and body provided -> reject
    const before = (cookies.rotateOnRefresh as unknown as jest.Mock).mock.calls.length;
    await expect(
      controller.refresh(
        { refreshToken: 'ignored' } as RefreshTokenDto,
        { headers: { cookie: 'bsaas_rt=a%2Fb' } } as unknown as ExpressRequest,
      ),
    ).rejects.toThrow();
    expect((cookies.rotateOnRefresh as unknown as jest.Mock).mock.calls.length).toBe(before);

    // cookie header present with refreshToken key but no '=' (undefined value) -> error
    await expect(
      controller.refresh(
        {} as RefreshTokenDto,
        { headers: { cookie: 'refreshToken' } } as unknown as ExpressRequest,
      ),
    ).rejects.toThrow();
  });

  it('TOTP login completes and sets cookies', async () => {
    const out = await controller.signInWithTotp({ tempToken: 't', totpCode: '123456' });
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }),
      expect.any(Object),
    );
  });

  it('logout clears cookies', async () => {
    await controller.logout({ user: { sessionId: 's1' } } as { user: { sessionId: string } });
    expect(cookies.clear).toHaveBeenCalled();
  });
});

