import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import type { WebAuthnPort, RecoveryCodesPort, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import type { Request as ExpressRequest } from 'express';
import type { WebauthnAttestationDto } from '../dto/webauthn-attestation.dto';
import type { WebauthnAssertionDto } from '../dto/webauthn-assertion.dto';
import { AuthCookiesService } from '../services/auth-cookies.service';

describe('AuthController branches (unit)', () => {
  let controller: AuthController;
  let service: jest.Mocked<Pick<AuthService,
    | 'signIn' | 'refreshToken' | 'logout' | 'listSessions' | 'revokeSession' | 'signInWithTotp'
    | 'requestPasswordReset' | 'resetPassword' | 'requestEmailVerification' | 'verifyEmail' | 'verifyEmailOtp'
    | 'issueTokensForUser' | 'resolveUserIdByEmail' | 'register'>>;
  let webAuthn: jest.Mocked<Pick<WebAuthnPort, 'startRegistration' | 'finishRegistration' | 'startAuthentication' | 'finishAuthentication'>>;
  let recovery: jest.Mocked<Pick<RecoveryCodesPort, 'generate' | 'verifyAndConsume'>>;
  let cookies: jest.Mocked<Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>>;

  beforeEach(() => {
    service = {
      signIn: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      listSessions: jest.fn(),
      revokeSession: jest.fn(),
      signInWithTotp: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      requestEmailVerification: jest.fn(),
      verifyEmail: jest.fn(),
      verifyEmailOtp: jest.fn(),
      issueTokensForUser: jest.fn(),
      resolveUserIdByEmail: jest.fn(),
      register: jest.fn(),
    };
    const startRegistration = jest.fn<Promise<Record<string, unknown>>, [string, string]>(
      (_u, _n) => Promise.resolve({ ok: 1 } as Record<string, unknown>),
    );
    const finishRegistration = jest.fn<Promise<{ credentialId: string; counter: number }>, [string, Record<string, unknown>]>(
      (_u, _r) => Promise.resolve({ credentialId: 'cid', counter: 0 }),
    );
    const startAuthentication = jest.fn<Promise<Record<string, unknown>>, [string]>(
      (_u) => Promise.resolve({ request: true } as Record<string, unknown>),
    );
    const finishAuthentication = jest.fn<Promise<{ credentialId: string; counter: number }>, [string, Record<string, unknown>]>(
      (_u, _r) => Promise.resolve({ credentialId: 'cid', counter: 1 }),
    );
    webAuthn = { startRegistration, finishRegistration, startAuthentication, finishAuthentication } as unknown as typeof webAuthn;
    recovery = {
      generate: jest.fn<Promise<string[]>, [string, (number | undefined)]>(() => Promise.resolve(['r1', 'r2'])),
      verifyAndConsume: jest.fn<Promise<boolean>, [string, string]>(() => Promise.resolve(true)),
    };
    const oauth = { start: jest.fn() };
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() };
    controller = new AuthController(service as unknown as AuthService, webAuthn as unknown as WebAuthnPort, recovery as unknown as RecoveryCodesPort, oauth as unknown as OAuthPort, cookies as unknown as AuthCookiesService);
  });

  it('signIn branches: totpRequired false and true', async () => {
    // non-TOTP path
    service.signIn.mockResolvedValueOnce({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' });
    const out1 = await controller.signIn({ email: 'e', password: 'p' } as LoginDto);
    expect(out1).toEqual({ totpRequired: false });
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at', refreshToken: 'rt' }));

    // TOTP required path
    service.signIn.mockResolvedValueOnce({ totpRequired: true, tempToken: 'tmp' });
    const out2 = await controller.signIn({ email: 'e', password: 'p' } as LoginDto);
    expect(out2).toEqual({ totpRequired: true, tempToken: 'tmp' });
  });

  it('refresh branches: cookie token, body token, unrelated cookie, no service refresh token, and missing token error', async () => {
    // cookie present path (bsaas_rt)
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A1', refreshToken: 'R1' });
    const req1 = { headers: { cookie: 'bsaas_rt=x' } } as unknown as ExpressRequest;
    const out1 = await controller.refresh({} as RefreshTokenDto, req1);
    expect(out1).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A1', refreshToken: 'R1' }));

    // fall back to body token
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A2', refreshToken: 'R2' });
    const req2 = { headers: {} } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'from-body' } as RefreshTokenDto, req2);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A2', refreshToken: 'R2' }));

    // unrelated cookie header, use body
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A3', refreshToken: 'R3' });
    const req3 = { headers: { cookie: 'foo=bar; XSRF-TOKEN=abc' } } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'from-body-2' } as RefreshTokenDto, req3);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A3', refreshToken: 'R3' }));

    // service returns no refreshToken
    service.refreshToken.mockResolvedValueOnce(undefined as unknown as { accessToken: string; refreshToken: string });
    const req4 = { headers: {} } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'body' } as RefreshTokenDto, req4);
    expect(cookies.issue).toHaveBeenCalled();

    // missing token entirely -> error
    const req5 = { headers: {} } as unknown as ExpressRequest;
    await expect(controller.refresh({} as RefreshTokenDto, req5)).rejects.toThrow();

    // cookie header present but empty refreshToken value -> error branch
    const req6 = { headers: { cookie: 'refreshToken=' } } as unknown as ExpressRequest;
    await expect(controller.refresh({} as RefreshTokenDto, req6)).rejects.toThrow();

    // cookie header present with refreshToken key but no '=' (undefined value) -> error
    const req6b = { headers: { cookie: 'refreshToken' } } as unknown as ExpressRequest;
    await expect(controller.refresh({} as RefreshTokenDto, req6b)).rejects.toThrow();

    // cookie present path using 'refreshToken' key and URL-encoded value
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A4', refreshToken: 'R4' });
    const req7 = { headers: { cookie: 'refreshToken=a%2Fb' } } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'ignored' } as RefreshTokenDto, req7);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A4', refreshToken: 'R4' }));
  });

  it('webauthnLoginStart uses default params and errors when none provided', async () => {
    await expect(controller.webauthnLoginStart()).rejects.toThrow();
  });

  it('logout clears cookies', async () => {
    await controller.logout({ user: { sessionId: 's1' } } as { user: { sessionId: string } });
    expect(cookies.clear).toHaveBeenCalled();
  });

  it('sessions and revoke endpoints', async () => {
    service.listSessions.mockResolvedValueOnce([{ id: 's1' }]);
    const list = await controller.listSessions({ user: { userId: 'u1' } } as { user: { userId: string } });
    expect(list).toEqual([{ id: 's1' }]);

    service.revokeSession.mockResolvedValueOnce({ success: true });
    const ok = await controller.revokeSession({ user: { userId: 'u1' } } as { user: { userId: string } }, 's1');
    expect(ok).toEqual({ success: true });

    service.revokeSession.mockResolvedValueOnce({ success: true });
    const ok2 = await controller.revokeSessionBody({ user: { userId: 'u1' } } as { user: { userId: string } }, { id: 's1' });
    expect(ok2).toEqual({ success: true });
  });

  it('TOTP login completes and sets cookies', async () => {
    service.signInWithTotp.mockResolvedValueOnce({ accessToken: 'AT', refreshToken: 'RT' });
    const out = await controller.signInWithTotp({ tempToken: 't', totpCode: '123456' } as { tempToken: string; totpCode: string });
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }));
  });

  it('account recovery and email flows', async () => {
    service.requestPasswordReset.mockResolvedValueOnce(undefined);
    expect(await controller.forgotPassword({ email: 'e' })).toEqual({ success: true });

    service.resetPassword.mockResolvedValueOnce(undefined);
    expect(await controller.resetPassword({ token: 't', newPassword: 'p' })).toEqual({ success: true });

    service.requestEmailVerification.mockResolvedValueOnce(undefined);
    expect(await controller.sendEmailVerification({ email: 'e' })).toEqual({ success: true });

    service.verifyEmail.mockResolvedValueOnce(undefined);
    expect(await controller.verifyEmail({ token: 't' })).toEqual({ success: true });

    service.requestEmailVerification.mockResolvedValueOnce(undefined);
    expect(await controller.emailVerifyRequest({ email: 'e' })).toEqual({ success: true });

    service.verifyEmail.mockResolvedValueOnce(undefined);
    expect(await controller.emailVerifyConfirm({ token: 't' })).toEqual({ success: true });
    service.verifyEmailOtp.mockResolvedValueOnce(undefined);
    expect(await controller.emailVerifyConfirm({ email: 'e', otp: '123456' })).toEqual({ success: true });
    await expect(controller.emailVerifyConfirm({} as { token?: string; email?: string; otp?: string })).rejects.toThrow();
  });

  it('WebAuthn flows', async () => {
    const start = await controller.webauthnRegisterStart({ username: 'name' }, { user: { userId: 'u1' } } as { user: { userId: string } });
    expect(start).toBeDefined();
    const finish = await controller.webauthnRegisterFinish({ response: {} } as unknown as WebauthnAttestationDto, { user: { userId: 'u1' } } as { user: { userId: string } });
    expect(finish).toEqual({ success: true });

    await expect(controller.webauthnLoginStart({}, {} as { user?: { userId: string } })).rejects.toThrow();
    const reqStart = await controller.webauthnLoginStart({}, { user: { userId: 'u1' } } as { user?: { userId: string } });
    expect(reqStart).toEqual({ request: true });

    service.issueTokensForUser.mockResolvedValueOnce({ accessToken: 'A', refreshToken: 'R' });
    const done = await controller.webauthnLoginFinish({ response: {} } as unknown as WebauthnAssertionDto, { user: { userId: 'u1' } } as { user: { userId: string } });
    expect(done).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A', refreshToken: 'R' }));
  });

  it('recovery generate/verify branches', async () => {
    const codes = await controller.generateRecovery({ user: { userId: 'u1' } } as { user: { userId: string } });
    expect(codes).toEqual(['r1', 'r2']);
    const codesAlias = await controller.generateRecoveryCodes({ user: { userId: 'u1' } } as { user: { userId: string } });
    expect(codesAlias).toEqual(['r1', 'r2']);
    // success branch
    recovery.verifyAndConsume.mockResolvedValueOnce(true);
    await expect(controller.verifyRecovery({ code: 'ok' }, { user: { userId: 'u1' } } as { user: { userId: string } })).resolves.toEqual({ success: true });
    recovery.verifyAndConsume.mockResolvedValueOnce(false);
    await expect(controller.verifyRecovery({ code: 'x' }, { user: { userId: 'u1' } } as { user: { userId: string } })).rejects.toThrow();
  });

  it('customer register calls service', async () => {
    (service.register as unknown as jest.Mock).mockResolvedValue(undefined);
    await expect(controller.register({ email: 'a@b.com', password: 'Password#1' } as unknown as import('../dto/register.dto').RegisterDto)).resolves.toEqual({ success: true });
  });
});
