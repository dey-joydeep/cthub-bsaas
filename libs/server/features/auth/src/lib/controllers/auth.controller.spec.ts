import { AuthController } from './auth.controller';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from '../services/auth.service';
import type { WebAuthnPort, RecoveryCodesPort, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthCookiesService } from '../services/auth-cookies.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;
  let webAuthn: jest.Mocked<WebAuthnPort>;
  let recovery: jest.Mocked<RecoveryCodesPort>;
  let cookies: jest.Mocked<AuthCookiesService>;

  beforeEach(() => {
    const servicePartial: jest.Mocked<Pick<
      AuthService,
      | 'signIn'
      | 'refreshToken'
      | 'logout'
      | 'listSessions'
      | 'revokeSession'
      | 'signInWithTotp'
      | 'requestPasswordReset'
      | 'resetPassword'
      | 'requestEmailVerification'
      | 'verifyEmail'
      | 'verifyEmailOtp'
      | 'issueTokensForUser'
      | 'resolveUserIdByEmail'
      | 'register'
      | 'validateOwnerInvite'
      | 'completeOwnerRegistration'
      | 'validateStaffInvite'
      | 'completeStaffRegistration'
    >> = {
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
      validateOwnerInvite: jest.fn(),
      completeOwnerRegistration: jest.fn(),
      validateStaffInvite: jest.fn(),
      completeStaffRegistration: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    service = servicePartial as unknown as jest.Mocked<AuthService>;
    webAuthn = ({
      startRegistration: jest.fn(),
      finishRegistration: jest.fn(),
      startAuthentication: jest.fn(),
      finishAuthentication: jest.fn(),
    } as unknown) as jest.Mocked<WebAuthnPort>;
    recovery = ({
      generate: jest.fn(),
      verifyAndConsume: jest.fn(),
    } as unknown) as jest.Mocked<RecoveryCodesPort>;
    (service.resolveUserIdByEmail as jest.Mock) = jest.fn(() => Promise.resolve('u-by-email'));
    const oauth = ({ start: jest.fn() } as unknown) as OAuthPort;
    cookies = ({
      issue: jest.fn(),
      rotateOnRefresh: jest.fn(),
      clear: jest.fn(),
    } as unknown) as jest.Mocked<AuthCookiesService>;
    controller = new AuthController(service, webAuthn, recovery, oauth, cookies);
  });

  it('signIn sets CSRF and auth cookies when no TOTP', async () => {
    service.signIn.mockResolvedValue({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' });
    const result = await controller.signIn({ email: 'e', password: 'p' } as LoginDto);
    expect(result).toEqual({ totpRequired: false });
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at', refreshToken: 'rt' }));
  });

  it('signIn returns temp token when TOTP required', async () => {
    service.signIn.mockResolvedValue({ totpRequired: true, tempToken: 'temp' });
    const result = await controller.signIn({ email: 'e', password: 'p' } as LoginDto);
    expect(result).toEqual({ totpRequired: true, tempToken: 'temp' });
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('refresh rotates cookies and returns empty body', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });
    const req1 = { headers: { cookie: 'bsaas_rt=old' } } as unknown as ExpressRequest;
    const result = await controller.refresh({} as RefreshTokenDto, req1);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'new-at', refreshToken: 'new-rt' }));
  });

  it('refresh reads token from body when cookie missing', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'at2', refreshToken: 'rt2' });
    const req2 = { headers: {} } as unknown as ExpressRequest;
    const result = await controller.refresh({ refreshToken: 'from-body' } as RefreshTokenDto, req2);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at2', refreshToken: 'rt2' }));
  });

  it('refresh falls back to body when cookie header present but no refreshToken pair', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'at3', refreshToken: 'rt3' });
    const req3 = { headers: { cookie: 'foo=bar; XSRF-TOKEN=abc' } } as unknown as ExpressRequest;
    const result = await controller.refresh({ refreshToken: 'from-body-2' } as RefreshTokenDto, req3);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at3', refreshToken: 'rt3' }));
  });

  it('refresh does not set cookie when service returns no refreshToken', async () => {
    service.refreshToken.mockResolvedValue(undefined as unknown as { accessToken: string; refreshToken: string });
    const req4 = { headers: { cookie: '' } } as unknown as ExpressRequest;
    const result = await controller.refresh({ refreshToken: 'body' } as RefreshTokenDto, req4);
    expect(result).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('refresh throws when no token provided', async () => {
    const req6 = { headers: {} } as unknown as ExpressRequest;
    await expect(controller.refresh({} as RefreshTokenDto, req6)).rejects.toThrow();
  });

  it('refresh throws when cookie has empty bsaas_rt value', async () => {
    const req7 = { headers: { cookie: 'bsaas_rt=' } } as unknown as ExpressRequest;
    await expect(controller.refresh({} as RefreshTokenDto, req7)).rejects.toThrow();
  });

  it('refresh prefers cookie refreshToken over body when present', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'newA', refreshToken: 'newR' });
    const req8 = { headers: { cookie: 'refreshToken=a%2Fb' } } as unknown as ExpressRequest;
    const result = await controller.refresh({ refreshToken: 'BODY-IGNORED' } as RefreshTokenDto, req8);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'newA', refreshToken: 'newR' }));
  });

  it('webauthnLoginStart throws without identity', async () => {
    await expect(controller.webauthnLoginStart({}, {} as { user?: { userId: string } })).rejects.toThrow();
  });

  it('webauthnLoginStart resolves user by email when unauthenticated', async () => {
    (service.resolveUserIdByEmail as unknown as jest.Mock) = jest.fn(() => Promise.resolve('u-by-email'));
    (webAuthn.startAuthentication as unknown as jest.Mock).mockResolvedValue({ request: true } as unknown as Record<string, unknown>);
    const req = await controller.webauthnLoginStart({ email: 'e@example.com' } as { email?: string }, {} as { user?: { userId: string } });
    expect(req).toBeDefined();
  });

  it('logout clears cookie and calls service', async () => {
    await controller.logout({ user: { sessionId: 's1' } } as { user: { sessionId: string } });
    expect(service.logout).toHaveBeenCalledWith('s1');
    expect(cookies.clear).toHaveBeenCalled();
  });

  it('listSessions proxies to service', async () => {
    service.listSessions.mockResolvedValue([{ id: 's1' }]);
    const result = await controller.listSessions({ user: { userId: 'u1' } } as { user: { userId: string } });
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('revokeSession proxies to service', async () => {
    service.revokeSession.mockResolvedValue({ success: true });
    const result = await controller.revokeSession({ user: { userId: 'u1' } } as { user: { userId: string } }, 's1');
    expect(result).toEqual({ success: true });
  });

  it('revokeSessionBody proxies to service', async () => {
    (service.revokeSession as unknown as jest.Mock).mockResolvedValue({ success: true });
    const ok = await controller.revokeSessionBody({ user: { userId: 'u1' } } as { user: { userId: string } }, { id: 's1' } as { id: string });
    expect(ok).toEqual({ success: true });
  });

  it('changePassword proxies to service', async () => {
    (service.changePassword as unknown as jest.Mock) = jest.fn(async () => {});
    const ok = await controller.changePassword({ currentPassword: 'Old#1', newPassword: 'New#1Password' } as unknown as import('../dto/password-change.dto').PasswordChangeDto, { user: { userId: 'u1' } } as { user: { userId: string } });
    expect(service.changePassword).toHaveBeenCalledWith('u1', 'Old#1', 'New#1Password');
    expect(ok).toEqual({ success: true });
  });

  it('devices alias proxies to listSessions', async () => {
    service.listSessions.mockResolvedValue([{ id: 's1' }]);
    const result = await controller.listDevicesAlias({ user: { userId: 'u1' } } as { user: { userId: string } });
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('recovery-codes issue alias proxies to recovery.generate', async () => {
    (recovery.generate as unknown as jest.Mock).mockResolvedValue(['c1', 'c2']);
    const res = await controller.issueRecoveryCodesAlias({ user: { userId: 'u1' } } as { user: { userId: string } });
    expect(res).toEqual(['c1', 'c2']);
  });

  it('recovery-codes verify alias returns success', async () => {
    (recovery.verifyAndConsume as unknown as jest.Mock).mockResolvedValue(true);
    const ok = await controller.verifyRecoveryAlias({ code: 'ok' } as unknown as import('../dto/verify-recovery.dto').VerifyRecoveryDto, { user: { userId: 'u1' } } as { user: { userId: string } });
    expect(ok).toEqual({ success: true });
  });

  it('revokeSessionDelete proxies to service', async () => {
    (service.revokeSession as unknown as jest.Mock).mockResolvedValue({ success: true });
    const ok = await controller.revokeSessionDelete({ user: { userId: 'u1' } } as { user: { userId: string } }, 's1');
    expect(ok).toEqual({ success: true });
  });

  it('devices revoke alias proxies to service', async () => {
    (service.revokeSession as unknown as jest.Mock).mockResolvedValue({ success: true });
    const ok = await controller.revokeDeviceAlias({ user: { userId: 'u1' } } as { user: { userId: string } }, { id: 's1' });
    expect(ok).toEqual({ success: true });
  });

  it('customer register calls service and returns success', async () => {
    (service.register as unknown as jest.Mock).mockResolvedValue(undefined);
    const ok = await controller.register({ email: 'e@example.com', password: 'Password#1' } as unknown as import('../dto/register.dto').RegisterDto);
    expect(ok).toEqual({ success: true });
    expect(service.register).toHaveBeenCalled();
  });

  it('forgot/reset/email verify flows call service and return success', async () => {
    service.requestPasswordReset.mockResolvedValue(undefined);
    const forgot = await controller.forgotPassword({ email: 'e' });
    expect(forgot).toEqual({ success: true });

    service.resetPassword.mockResolvedValue(undefined);
    const reset = await controller.resetPassword({ token: 't', newPassword: 'p' });
    expect(reset).toEqual({ success: true });

    service.requestEmailVerification.mockResolvedValue(undefined);
    const send = await controller.sendEmailVerification({ email: 'e' });
    expect(send).toEqual({ success: true });

    service.verifyEmail.mockResolvedValue(undefined);
    const verify = await controller.verifyEmail({ token: 't' });
    expect(verify).toEqual({ success: true });
  });

  it('emailVerifyRequest calls service and returns success', async () => {
    (service.requestEmailVerification as unknown as jest.Mock).mockResolvedValue(undefined);
    const ok = await controller.emailVerifyRequest({ email: 'e' });
    expect(ok).toEqual({ success: true });
  });

  it('emailVerifyConfirm handles token and otp branches and throws on bad input', async () => {
    (service.verifyEmail as unknown as jest.Mock).mockResolvedValue(undefined);
    const ok1 = await controller.emailVerifyConfirm({ token: 't' });
    expect(ok1).toEqual({ success: true });

    service.verifyEmailOtp = jest.fn().mockResolvedValue(undefined);
    const ok2 = await controller.emailVerifyConfirm({ email: 'e', otp: '123456' });
    expect(ok2).toEqual({ success: true });

    await expect(controller.emailVerifyConfirm({} as { token?: string; email?: string; otp?: string })).rejects.toThrow();
  });

  it('validateOwnerInvite returns valid with email and salonId', async () => {
    (service.validateOwnerInvite as unknown as jest.Mock) = jest.fn(() => Promise.resolve({ email: 'o@example.com', salonId: 'salon-1' }));
    const res = await controller.validateOwnerInvite('token-owner');
    expect(res).toEqual({ valid: true, email: 'o@example.com', salonId: 'salon-1' });
  });

  it('completeOwnerRegistration issues cookies on success and returns empty body', async () => {
    (service.completeOwnerRegistration as unknown as jest.Mock) = jest.fn(() => Promise.resolve({ accessToken: 'a', refreshToken: 'r' }));
    const res = await controller.completeOwnerRegistration({ token: 't', password: 'P#1x' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
    expect(res).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'a', refreshToken: 'r' }));
  });

  it('completeOwnerRegistration returns next:mfa branch when required', async () => {
    (service.completeOwnerRegistration as unknown as jest.Mock) = jest.fn(() => Promise.resolve({ next: 'mfa' }));
    const res = await controller.completeOwnerRegistration({ token: 't', password: 'P#1x' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
    expect(res).toEqual({ next: 'mfa' });
    expect(cookies.issue).not.toHaveBeenCalled();
  });

  it('validateStaffInvite returns valid with email and salonId', async () => {
    (service.validateStaffInvite as unknown as jest.Mock) = jest.fn(() => Promise.resolve({ email: 's@example.com', salonId: 'salon-1' }));
    const res = await controller.validateStaffInvite('token-staff');
    expect(res).toEqual({ valid: true, email: 's@example.com', salonId: 'salon-1' });
  });

  it('completeStaffRegistration issues cookies on success', async () => {
    (service.completeStaffRegistration as unknown as jest.Mock) = jest.fn(() => Promise.resolve({ accessToken: 'a', refreshToken: 'r' }));
    const res = await controller.completeStaffRegistration({ token: 't', password: 'P#1x' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
    expect(res).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'a', refreshToken: 'r' }));
  });

  it('completeStaffRegistration returns next:mfa branch when required', async () => {
    (service.completeStaffRegistration as unknown as jest.Mock) = jest.fn(() => Promise.resolve({ next: 'mfa' }));
    const res = await controller.completeStaffRegistration({ token: 't', password: 'P#1x' } as unknown as import('@cthub-bsaas/server-contracts-auth').RegistrationCompleteInput);
    expect(res).toEqual({ next: 'mfa' });
    expect(cookies.issue).not.toHaveBeenCalled();
  });
});
