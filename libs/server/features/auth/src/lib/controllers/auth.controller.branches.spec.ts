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
  let service: jest.Mocked<AuthService>;
  let webAuthn: jest.Mocked<WebAuthnPort>;
  let recovery: jest.Mocked<RecoveryCodesPort>;

  let cookies: jest.Mocked<AuthCookiesService>;

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
    } as unknown as jest.Mocked<AuthService>;
    webAuthn = {
      startRegistration: jest.fn().mockResolvedValue({ ok: 1 } as unknown as Record<string, unknown>),
      finishRegistration: jest.fn().mockResolvedValue(undefined as unknown as void),
      startAuthentication: jest.fn().mockResolvedValue({ request: true } as unknown as Record<string, unknown>),
      finishAuthentication: jest.fn().mockResolvedValue(undefined as unknown as void),
    } as unknown as jest.Mocked<WebAuthnPort>;
    recovery = {
      generate: jest.fn().mockResolvedValue(['r1', 'r2']),
      verifyAndConsume: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<RecoveryCodesPort>;
    const oauth = { start: jest.fn() } as unknown as OAuthPort;
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() } as unknown as jest.Mocked<AuthCookiesService>;
    controller = new AuthController(service, webAuthn, recovery, oauth, cookies);
  });

  it('signIn branches: totpRequired false and true', async () => {
    // non-TOTP path
    service.signIn.mockResolvedValueOnce({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' });
    const out1 = await controller.signIn({ email: 'e', password: 'p' } as LoginDto);
    expect(out1).toEqual({ totpRequired: false });
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at', refreshToken: 'rt', csrf: expect.any(String) }));

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
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A1', refreshToken: 'R1', csrf: expect.any(String) }));

    // fall back to body token
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A2', refreshToken: 'R2' });
    const req2 = { headers: {} } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'from-body' } as RefreshTokenDto, req2);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A2', refreshToken: 'R2', csrf: expect.any(String) }));

    // unrelated cookie header, use body
    service.refreshToken.mockResolvedValueOnce({ accessToken: 'A3', refreshToken: 'R3' });
    const req3 = { headers: { cookie: 'foo=bar; XSRF-TOKEN=abc' } } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'from-body-2' } as RefreshTokenDto, req3);
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A3', refreshToken: 'R3', csrf: expect.any(String) }));

    // service returns no refreshToken
    service.refreshToken.mockResolvedValueOnce(undefined as unknown as { accessToken: string; refreshToken: string });
    const req4 = { headers: {} } as unknown as ExpressRequest;
    await controller.refresh({ refreshToken: 'body' } as RefreshTokenDto, req4);
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ csrf: expect.any(String) }));

    // missing token entirely -> error
    const req5 = { headers: {} } as unknown as ExpressRequest;
    await expect(controller.refresh({} as RefreshTokenDto, req5)).rejects.toThrow();

    // cookie header present but empty refreshToken value -> error branch
    const req6 = { headers: { cookie: 'refreshToken=' } } as unknown as ExpressRequest;
    await expect(controller.refresh({} as RefreshTokenDto, req6)).rejects.toThrow();
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
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT', csrf: expect.any(String) }));
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
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A', refreshToken: 'R', csrf: expect.any(String) }));
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

  it('register placeholder', () => {
    expect(controller.registerPlaceholder()).toEqual({ success: true });
  });
});
