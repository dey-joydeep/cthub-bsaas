import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import type { WebAuthnPort, RecoveryCodesPort, OAuthPort, RegistrationCompleteInput } from '@cthub-bsaas/server-contracts-auth';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
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
    | 'issueTokensForUser' | 'resolveUserIdByEmail' | 'register' | 'validateOwnerInvite' | 'completeOwnerRegistration'
    | 'validateStaffInvite' | 'completeStaffRegistration' | 'changePassword' | 'requestEmailChange' | 'confirmEmailChange'
    | 'signInWithSocial' | 'linkSocialAccount' | 'unlinkSocialAccount'>>;
  let webAuthn: jest.Mocked<Pick<WebAuthnPort, 'startRegistration' | 'finishRegistration' | 'startAuthentication' | 'finishAuthentication'>>;
  let recovery: jest.Mocked<Pick<RecoveryCodesPort, 'generate' | 'verifyAndConsume'>>;
  let oauth: jest.Mocked<Pick<OAuthPort, 'start' | 'exchangeCode'>>;
  let cookies: jest.Mocked<Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>>;

  beforeEach(() => {
    service = {
      signIn: jest.fn().mockResolvedValue({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' }),
      refreshToken: jest.fn().mockResolvedValue({ accessToken: 'A1', refreshToken: 'R1' }),
      logout: jest.fn().mockResolvedValue(undefined),
      listSessions: jest.fn().mockResolvedValue([]),
      revokeSession: jest.fn().mockResolvedValue({ success: true }),
      signInWithTotp: jest.fn().mockResolvedValue({ accessToken: 'AT', refreshToken: 'RT' }),
      requestPasswordReset: jest.fn().mockResolvedValue(undefined),
      resetPassword: jest.fn().mockResolvedValue(undefined),
      requestEmailVerification: jest.fn().mockResolvedValue(undefined),
      verifyEmail: jest.fn().mockResolvedValue(undefined),
      verifyEmailOtp: jest.fn().mockResolvedValue(undefined),
      issueTokensForUser: jest.fn().mockResolvedValue({ accessToken: 'AISS', refreshToken: 'RISS' }),
      resolveUserIdByEmail: jest.fn().mockResolvedValue('resolved-id'),
      register: jest.fn().mockResolvedValue(undefined),
      validateOwnerInvite: jest.fn().mockResolvedValue({ email: 'owner@example.com', salonId: 'salon-1' }),
      completeOwnerRegistration: jest.fn().mockResolvedValue({ accessToken: 'owner-at', refreshToken: 'owner-rt' }),
      validateStaffInvite: jest.fn().mockResolvedValue({ email: 'staff@example.com', salonId: 'salon-1', role: 'STAFF' }),
      completeStaffRegistration: jest.fn().mockResolvedValue({ accessToken: 'staff-at', refreshToken: 'staff-rt' }),
      changePassword: jest.fn().mockResolvedValue(undefined),
      requestEmailChange: jest.fn().mockResolvedValue(undefined),
      confirmEmailChange: jest.fn().mockResolvedValue(undefined),
      signInWithSocial: jest.fn().mockResolvedValue({ accessToken: 'SOC-AT', refreshToken: 'SOC-RT' }),
      linkSocialAccount: jest.fn().mockResolvedValue(undefined),
      unlinkSocialAccount: jest.fn().mockResolvedValue(undefined),
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
    oauth = {
      start: jest.fn().mockResolvedValue({ redirectUrl: 'https://example.com/oauth' }),
      exchangeCode: jest.fn().mockResolvedValue({ provider: 'google', providerUserId: 'pid' }),
    } as unknown as jest.Mocked<Pick<OAuthPort, 'start' | 'exchangeCode'>>;
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() };
    controller = new AuthController(
      service as unknown as AuthService,
      webAuthn as unknown as WebAuthnPort,
      recovery as unknown as RecoveryCodesPort,
      oauth as unknown as OAuthPort,
      cookies as unknown as AuthCookiesService,
    );
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
    service.refreshToken.mockResolvedValueOnce(
      undefined as unknown as Awaited<ReturnType<AuthService['refreshToken']>>,
    );
    const req4 = { headers: {} } as unknown as ExpressRequest;
    await expect(controller.refresh({ refreshToken: 'body' } as RefreshTokenDto, req4)).rejects.toThrow();
    expect(cookies.issue).not.toHaveBeenCalled();

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
    await expect(
      controller.webauthnLoginStart(
        {} as { email?: string; userId?: string },
        undefined as unknown as AuthenticatedUser,
      ),
    ).rejects.toThrow();
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

    await expect(controller.webauthnLoginStart({}, {} as AuthenticatedUser)).rejects.toThrow();
    const reqStart = await controller.webauthnLoginStart({}, { userId: 'u1' } as unknown as AuthenticatedUser);
    expect(reqStart).toEqual({ request: true });

    service.issueTokensForUser.mockResolvedValueOnce({ accessToken: 'A', refreshToken: 'R' });
    const done = await controller.webauthnLoginFinish(
      { response: {} } as unknown as WebauthnAssertionDto,
      { userId: 'u1' } as unknown as AuthenticatedUser,
    );
    expect(done).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'A', refreshToken: 'R' }));
  });

  it('webauthnLoginFinish throws when user context missing', async () => {
    await expect(
      controller.webauthnLoginFinish(
        { response: {} } as unknown as WebauthnAssertionDto,
        undefined as unknown as AuthenticatedUser,
      ),
    ).rejects.toThrow();
    expect(cookies.issue).not.toHaveBeenCalled();
  });

  it('recovery generate/verify branches', async () => {
    const codes = await controller.generateRecovery({ user: { userId: 'u1' } } as { user: { userId: string } });
    expect(codes).toEqual(['r1', 'r2']);

    // success branch
    recovery.verifyAndConsume.mockResolvedValueOnce(true);
    await expect(controller.verifyRecovery({ code: 'ok' }, { user: { userId: 'u1' } } as { user: { userId: string } })).resolves.toEqual({ success: true });
    recovery.verifyAndConsume.mockResolvedValueOnce(false);
    await expect(controller.verifyRecovery({ code: 'x' }, { user: { userId: 'u1' } } as { user: { userId: string } })).rejects.toThrow();
  });

  it('customer register calls service', async () => {
    (service.register as unknown as jest.Mock).mockResolvedValue(undefined);
    await expect(
      controller.register({ email: 'a@b.com', password: 'Password#1' } as unknown as import('../dto/register.dto').RegisterDto),
    ).resolves.toEqual({ success: true });
  });

  it('webauthnLoginStart handles undefined body and id-based user token', async () => {
    const start = await controller.webauthnLoginStart(
      undefined as unknown as { email?: string; userId?: string },
      { id: 'id-only-user' } as unknown as AuthenticatedUser,
    );
    expect(start).toEqual({ request: true });
  });

  it('webauthnLoginStart rejects when extractUserId returns invalid value', async () => {
    await expect(
      controller.webauthnLoginStart({}, { userId: 123 } as unknown as AuthenticatedUser),
    ).rejects.toThrow();
  });

  describe('error propagation', () => {
    const forced = new Error('forced failure');

    const serviceErrorCases = [
      {
        name: 'validateOwnerInvite',
        stub: () => service.validateOwnerInvite as unknown as jest.Mock,
        invoke: () => controller.validateOwnerInvite('tok'),
      },
      {
        name: 'completeOwnerRegistration',
        stub: () => service.completeOwnerRegistration as unknown as jest.Mock,
        invoke: () =>
          controller.completeOwnerRegistration({ token: 'tok', password: 'Password#1' } as RegistrationCompleteInput),
      },
      {
        name: 'validateStaffInvite',
        stub: () => service.validateStaffInvite as unknown as jest.Mock,
        invoke: () => controller.validateStaffInvite('tok'),
      },
      {
        name: 'completeStaffRegistration',
        stub: () => service.completeStaffRegistration as unknown as jest.Mock,
        invoke: () =>
          controller.completeStaffRegistration({ token: 'tok', password: 'Password#1' } as RegistrationCompleteInput),
      },
      {
        name: 'signIn',
        stub: () => service.signIn as unknown as jest.Mock,
        invoke: () => controller.signIn({ email: 'e@example.com', password: 'Password#1' } as LoginDto),
      },
      {
        name: 'refresh',
        stub: () => service.refreshToken as unknown as jest.Mock,
        invoke: () => controller.refresh(
          { refreshToken: 'body' } as RefreshTokenDto,
          { headers: {} } as unknown as ExpressRequest,
        ),
      },
      {
        name: 'logout',
        stub: () => service.logout as unknown as jest.Mock,
        invoke: () => controller.logout({ user: { sessionId: 'sess-1' } } as { user: { sessionId: string } }),
      },
      {
        name: 'listSessions',
        stub: () => service.listSessions as unknown as jest.Mock,
        invoke: () => controller.listSessions({ user: { userId: 'u1' } } as { user: { userId: string } }),
      },

      {
        name: 'revokeSession',
        stub: () => service.revokeSession as unknown as jest.Mock,
        invoke: () => controller.revokeSession({ user: { userId: 'u1' } } as { user: { userId: string } }, 'sess-1'),
      },

      {
        name: 'signInWithTotp',
        stub: () => service.signInWithTotp as unknown as jest.Mock,
        invoke: () =>
          controller.signInWithTotp({ tempToken: 'tmp', totpCode: '123456' } as { tempToken: string; totpCode: string }),
      },
      {
        name: 'forgotPassword',
        stub: () => service.requestPasswordReset as unknown as jest.Mock,
        invoke: () => controller.forgotPassword({ email: 'e@example.com' }),
      },
      {
        name: 'resetPassword',
        stub: () => service.resetPassword as unknown as jest.Mock,
        invoke: () =>
          controller.resetPassword({ token: 'tok', newPassword: 'Password#2' } as { token: string; newPassword: string }),
      },

      {
        name: 'changePassword',
        stub: () => service.changePassword as unknown as jest.Mock,
        invoke: () =>
          controller.changePassword(
            { currentPassword: 'Old#1', newPassword: 'New#1Pass' } as { currentPassword: string; newPassword: string },
            { user: { userId: 'u1' } } as { user: { userId: string } },
          ),
      },
      {
        name: 'requestEmailChange',
        stub: () => service.requestEmailChange as unknown as jest.Mock,
        invoke: () =>
          controller.requestEmailChange(
            { newEmail: 'new@example.com' } as { newEmail: string },
            { user: { userId: 'u1' } } as { user: { userId: string } },
          ),
      },
      {
        name: 'confirmEmailChange',
        stub: () => service.confirmEmailChange as unknown as jest.Mock,
        invoke: () => controller.confirmEmailChange({ token: 'tok' } as { token: string }),
      },
      {
        name: 'emailVerifyRequest',
        stub: () => service.requestEmailVerification as unknown as jest.Mock,
        invoke: () => controller.emailVerifyRequest({ email: 'e@example.com' }),
      },
      {
        name: 'emailVerifyConfirm token branch',
        stub: () => service.verifyEmail as unknown as jest.Mock,
        invoke: () => controller.emailVerifyConfirm({ token: 'tok' }),
      },
      {
        name: 'emailVerifyConfirm otp branch',
        stub: () => service.verifyEmailOtp as unknown as jest.Mock,
        invoke: () => controller.emailVerifyConfirm({ email: 'e@example.com', otp: '123456' }),
      },
      {
        name: 'register',
        stub: () => service.register as unknown as jest.Mock,
        invoke: () => controller.register({ email: 'e@example.com', password: 'Password#1' } as { email: string; password: string }),
      },
      {
        name: 'oauthUnlink',
        stub: () => service.unlinkSocialAccount as unknown as jest.Mock,
        invoke: () => controller.oauthUnlink('google', { user: { userId: 'u1' } }),
      },

      {
        name: 'webauthnLoginStart resolveUserIdByEmail',
        stub: () => service.resolveUserIdByEmail as unknown as jest.Mock,
        invoke: () => controller.webauthnLoginStart({ email: 'missing@example.com' }, undefined as unknown as AuthenticatedUser),
      },
      {
        name: 'webauthnLoginFinish issueTokensForUser',
        stub: () => service.issueTokensForUser as unknown as jest.Mock,
        invoke: () =>
          controller.webauthnLoginFinish(
            { response: {} } as unknown as WebauthnAssertionDto,
            { userId: 'u1' } as unknown as AuthenticatedUser,
          ),
      },
    ] as const;

    for (const { name, stub, invoke } of serviceErrorCases) {
      it(`propagates errors from ${name}`, async () => {
        const mock = stub();
        mock.mockRejectedValueOnce(forced);
        await expect(invoke()).rejects.toBe(forced);
      });
    }

    const webAuthnCases = [
      {
        name: 'webauthnRegisterStart',
        stub: () => webAuthn.startRegistration as unknown as jest.Mock,
        invoke: () =>
          controller.webauthnRegisterStart({ username: 'demo' }, { user: { userId: 'u1' } } as { user: { userId: string } }),
      },
      {
        name: 'webauthnRegisterFinish',
        stub: () => webAuthn.finishRegistration as unknown as jest.Mock,
        invoke: () =>
          controller.webauthnRegisterFinish(
            { response: {} } as unknown as WebauthnAttestationDto,
            { user: { userId: 'u1' } } as { user: { userId: string } },
          ),
      },
      {
        name: 'webauthnLoginFinish finishAuthentication',
        stub: () => webAuthn.finishAuthentication as unknown as jest.Mock,
        invoke: () =>
          controller.webauthnLoginFinish(
            { response: {} } as unknown as WebauthnAssertionDto,
            { userId: 'u1' } as unknown as AuthenticatedUser,
          ),
      },
    ] as const;

    for (const { name, stub, invoke } of webAuthnCases) {
      it(`propagates errors from ${name}`, async () => {
        const mock = stub();
        mock.mockRejectedValueOnce(forced);
        await expect(invoke()).rejects.toBe(forced);
      });
    }

    const recoveryCases = [
      {
        name: 'generateRecovery',
        stub: () => recovery.generate as unknown as jest.Mock,
        invoke: () => controller.generateRecovery({ user: { userId: 'u1' } } as { user: { userId: string } }),
      },

      {
        name: 'verifyRecovery',
        stub: () => recovery.verifyAndConsume as unknown as jest.Mock,
        invoke: () => controller.verifyRecovery({ code: 'C' }, { user: { userId: 'u1' } } as { user: { userId: string } }),
      },

    ] as const;

    for (const { name, stub, invoke } of recoveryCases) {
      it(`propagates errors from ${name}`, async () => {
        const mock = stub();
        mock.mockRejectedValueOnce(forced);
        await expect(invoke()).rejects.toBe(forced);
      });
    }

    it('oauthStart propagates errors', async () => {
      (oauth.start as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(controller.oauthStart('google')).rejects.toBe(forced);
    });

    it('oauthCallback propagates exchange errors', async () => {
      (oauth.exchangeCode as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(controller.oauthCallback('google', undefined, 'code', 'state')).rejects.toBe(forced);
    });

    it('oauthCallback propagates link errors', async () => {
      (oauth.exchangeCode as unknown as jest.Mock).mockResolvedValueOnce({ provider: 'google', providerUserId: 'pid' });
      (service.linkSocialAccount as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(
        controller.oauthCallback('google', { userId: 'u1' } as unknown as AuthenticatedUser, 'code', 'state'),
      ).rejects.toBe(forced);
    });

    it('oauthCallback propagates sign-in errors', async () => {
      (oauth.exchangeCode as unknown as jest.Mock).mockResolvedValueOnce({ provider: 'google', providerUserId: 'pid' });
      (service.signInWithSocial as unknown as jest.Mock).mockRejectedValueOnce(forced);
      await expect(controller.oauthCallback('google', undefined, 'code', 'state')).rejects.toBe(forced);
    });
  });
});
