import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import type { WebAuthnPort, RecoveryCodesPort, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { EmailChangeRequestDto } from '../dto/email-change-request.dto';
import { EmailChangeConfirmDto } from '../dto/email-change-confirm.dto';
import { validate } from 'class-validator';

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
      | 'requestEmailChange'
      | 'confirmEmailChange'
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
      requestEmailChange: jest.fn(),
      confirmEmailChange: jest.fn(),
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
    const result = await controller.signIn({ email: 'e', password: 'p' } as any);
    expect(result).toEqual({ totpRequired: false });
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at', refreshToken: 'rt' }));
  });

  it('signIn returns temp token when TOTP required', async () => {
    service.signIn.mockResolvedValue({ totpRequired: true, tempToken: 'temp' });
    const result = await controller.signIn({ email: 'e', password: 'p' } as any);
    expect(result).toEqual({ totpRequired: true, tempToken: 'temp' });
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('refresh rotates cookies and returns empty body', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });
    const req1 = { headers: { cookie: 'bsaas_rt=old' } } as any;
    const result = await controller.refresh({} as any, req1);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'new-at', refreshToken: 'new-rt' }));
  });

  it('refresh reads token from body when cookie missing', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'at2', refreshToken: 'rt2' });
    const req2 = { headers: {} } as any;
    const result = await controller.refresh({ refreshToken: 'from-body' } as any, req2);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at2', refreshToken: 'rt2' }));
  });

  it('refresh falls back to body when cookie header present but no refreshToken pair', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'at3', refreshToken: 'rt3' });
    const req3 = { headers: { cookie: 'foo=bar; XSRF-TOKEN=abc' } } as any;
    const result = await controller.refresh({ refreshToken: 'from-body-2' } as any, req3);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at3', refreshToken: 'rt3' }));
  });

  it('refresh does not set cookie when service returns no refreshToken', async () => {
    service.refreshToken.mockResolvedValue(undefined as any);
    const req4 = { headers: { cookie: '' } } as any;
    const result = await controller.refresh({ refreshToken: 'body' } as any, req4);
    expect(result).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('refresh throws when no token provided', async () => {
    const req6 = { headers: {} } as any;
    await expect(controller.refresh({} as any, req6)).rejects.toThrow();
  });

  it('refresh throws when cookie has empty bsaas_rt value', async () => {
    const req7 = { headers: { cookie: 'bsaas_rt=' } } as any;
    await expect(controller.refresh({} as any, req7)).rejects.toThrow();
  });

  it('refresh prefers cookie refreshToken over body when present', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'newA', refreshToken: 'newR' });
    const req8 = { headers: { cookie: 'refreshToken=a%2Fb' } } as any;
    const result = await controller.refresh({ refreshToken: 'BODY-IGNORED' } as any, req8);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'newA', refreshToken: 'newR' }));
  });

  it('webauthnLoginStart throws without identity', async () => {
    await expect(controller.webauthnLoginStart({}, {} as any)).rejects.toThrow();
  });

  it('webauthnLoginStart resolves user by email when unauthenticated', async () => {
    (service.resolveUserIdByEmail as jest.Mock) = jest.fn(() => Promise.resolve('u-by-email'));
    (webAuthn.startAuthentication as jest.Mock).mockResolvedValue({ request: true } as any);
    const req = await controller.webauthnLoginStart({ email: 'e@example.com' } as any, {} as any);
    expect(req).toBeDefined();
  });

  it('logout clears cookie and calls service', async () => {
    await controller.logout({ user: { sessionId: 's1' } } as any);
    expect(service.logout).toHaveBeenCalledWith('s1');
    expect(cookies.clear).toHaveBeenCalled();
  });

  it('listSessions proxies to service', async () => {
    service.listSessions.mockResolvedValue([{ id: 's1' }]);
    const result = await controller.listSessions({ user: { userId: 'u1' } } as any);
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('revokeSession proxies to service', async () => {
    service.revokeSession.mockResolvedValue({ success: true });
    const result = await controller.revokeSession({ user: { userId: 'u1' } } as any, 's1');
    expect(result).toEqual({ success: true });
  });

  it('revokeSessionBody proxies to service', async () => {
    (service.revokeSession as jest.Mock).mockResolvedValue({ success: true });
    const ok = await controller.revokeSessionBody({ user: { userId: 'u1' } } as any, { id: 's1' } as any);
    expect(ok).toEqual({ success: true });
  });

  it('changePassword proxies to service', async () => {
    (service.changePassword as jest.Mock) = jest.fn(async () => {});
    const ok = await controller.changePassword({ currentPassword: 'Old#1', newPassword: 'New#1Password' } as any, { user: { userId: 'u1' } } as any);
    expect(service.changePassword).toHaveBeenCalledWith('u1', 'Old#1', 'New#1Password');
    expect(ok).toEqual({ success: true });
  });

  it('devices alias proxies to listSessions', async () => {
    service.listSessions.mockResolvedValue([{ id: 's1' }]);
    const result = await controller.listDevicesAlias({ user: { userId: 'u1' } } as any);
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('recovery-codes issue alias proxies to recovery.generate', async () => {
    (recovery.generate as jest.Mock).mockResolvedValue(['c1', 'c2']);
    const res = await controller.issueRecoveryCodesAlias({ user: { userId: 'u1' } } as any);
    expect(res).toEqual(['c1', 'c2']);
  });

  it('recovery-codes verify alias returns success', async () => {
    (recovery.verifyAndConsume as jest.Mock).mockResolvedValue(true);
    const ok = await controller.verifyRecoveryAlias({ code: 'ok' } as any, { user: { userId: 'u1' } } as any);
    expect(ok).toEqual({ success: true });
  });

  it('revokeSessionDelete proxies to service', async () => {
    (service.revokeSession as jest.Mock).mockResolvedValue({ success: true });
    const ok = await controller.revokeSessionDelete({ user: { userId: 'u1' } } as any, 's1');
    expect(ok).toEqual({ success: true });
  });

  it('devices revoke alias proxies to service', async () => {
    (service.revokeSession as jest.Mock).mockResolvedValue({ success: true });
    const ok = await controller.revokeDeviceAlias({ user: { userId: 'u1' } } as any, { id: 's1' });
    expect(ok).toEqual({ success: true });
  });

  it('customer register calls service and returns success', async () => {
    (service.register as jest.Mock).mockResolvedValue(undefined);
    const ok = await controller.register({ email: 'e@example.com', password: 'Password#1' } as any);
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
    (service.requestEmailVerification as jest.Mock).mockResolvedValue(undefined);
    const ok = await controller.emailVerifyRequest({ email: 'e' });
    expect(ok).toEqual({ success: true });
  });

  it('emailVerifyConfirm handles token and otp branches and throws on bad input', async () => {
    (service.verifyEmail as jest.Mock).mockResolvedValue(undefined);
    const ok1 = await controller.emailVerifyConfirm({ token: 't' });
    expect(ok1).toEqual({ success: true });

    service.verifyEmailOtp = jest.fn().mockResolvedValue(undefined);
    const ok2 = await controller.emailVerifyConfirm({ email: 'e', otp: '123456' });
    expect(ok2).toEqual({ success: true });

    await expect(controller.emailVerifyConfirm({} as any)).rejects.toThrow();
  });

  it('validateOwnerInvite returns valid with email and salonId', async () => {
    (service.validateOwnerInvite as jest.Mock) = jest.fn(() => Promise.resolve({ email: 'o@example.com', salonId: 'salon-1' }));
    const res = await controller.validateOwnerInvite('token-owner');
    expect(res).toEqual({ valid: true, email: 'o@example.com', salonId: 'salon-1' });
  });

  it('completeOwnerRegistration issues cookies on success and returns empty body', async () => {
    (service.completeOwnerRegistration as jest.Mock) = jest.fn(() => Promise.resolve({ accessToken: 'a', refreshToken: 'r' }));
    const res = await controller.completeOwnerRegistration({ token: 't', password: 'P#1x' } as any);
    expect(res).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'a', refreshToken: 'r' }));
  });

  it('completeOwnerRegistration returns next:mfa branch when required', async () => {
    (service.completeOwnerRegistration as jest.Mock) = jest.fn(() => Promise.resolve({ next: 'mfa' }));
    const res = await controller.completeOwnerRegistration({ token: 't', password: 'P#1x' } as any);
    expect(res).toEqual({ next: 'mfa' });
    expect(cookies.issue).not.toHaveBeenCalled();
  });

  it('validateStaffInvite returns valid with email and salonId', async () => {
    (service.validateStaffInvite as jest.Mock) = jest.fn(() => Promise.resolve({ email: 's@example.com', salonId: 'salon-1' }));
    const res = await controller.validateStaffInvite('token-staff');
    expect(res).toEqual({ valid: true, email: 's@example.com', salonId: 'salon-1' });
  });

  it('completeStaffRegistration issues cookies on success', async () => {
    (service.completeStaffRegistration as jest.Mock) = jest.fn(() => Promise.resolve({ accessToken: 'a', refreshToken: 'r' }));
    const res = await controller.completeStaffRegistration({ token: 't', password: 'P#1x' } as any);
    expect(res).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'a', refreshToken: 'r' }));
  });

  it('completeStaffRegistration returns next:mfa branch when required', async () => {
    (service.completeStaffRegistration as jest.Mock) = jest.fn(() => Promise.resolve({ next: 'mfa' }));
    const res = await controller.completeStaffRegistration({ token: 't', password: 'P#1x' } as any);
    expect(res).toEqual({ next: 'mfa' });
    expect(cookies.issue).not.toHaveBeenCalled();
  });

  describe('Email Change', () => {
    it('requestEmailChange proxies to service', async () => {
      const result = await controller.requestEmailChange({ newEmail: 'new@example.com' }, { user: { userId: 'u1' } });
      expect(service.requestEmailChange).toHaveBeenCalledWith('u1', 'new@example.com');
      expect(result).toEqual({ success: true });
    });

    it('confirmEmailChange proxies to service', async () => {
      const result = await controller.confirmEmailChange({ token: 'test-token' });
      expect(service.confirmEmailChange).toHaveBeenCalledWith('test-token');
      expect(result).toEqual({ success: true });
    });
  });

  describe('DTOs', () => {
    it('EmailChangeRequestDto should be valid', async () => {
      const dto = new EmailChangeRequestDto();
      dto.newEmail = 'test@example.com';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('EmailChangeRequestDto should be invalid with invalid email', async () => {
      const dto = new EmailChangeRequestDto();
      dto.newEmail = 'invalid-email';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it('EmailChangeRequestDto should be invalid with empty email', async () => {
      const dto = new EmailChangeRequestDto();
      dto.newEmail = '';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });

    it('EmailChangeConfirmDto should be valid', async () => {
      const dto = new EmailChangeConfirmDto();
      dto.token = 'test-token';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('EmailChangeConfirmDto should be invalid with empty token', async () => {
      const dto = new EmailChangeConfirmDto();
      dto.token = '';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
    });
  });
});
