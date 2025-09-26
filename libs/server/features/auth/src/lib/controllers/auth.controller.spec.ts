import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import type { WebAuthnPort, RecoveryCodesPort, OAuthPort, RegistrationCompleteInput } from '@cthub-bsaas/server-contracts-auth';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { EmailChangeRequestDto } from '../dto/email-change-request.dto';
import { EmailChangeConfirmDto } from '../dto/email-change-confirm.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { PasswordChangeDto } from '../dto/password-change.dto';
import { VerifyRecoveryDto } from '../dto/verify-recovery.dto';
import { validate } from 'class-validator';
import type { Request as ExpressRequest } from 'express';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;
  let webAuthn: jest.Mocked<WebAuthnPort>;
  let recovery: jest.Mocked<RecoveryCodesPort>;
  let cookies: jest.Mocked<AuthCookiesService>;
  let oauth: jest.Mocked<OAuthPort>;

  const createLoginDto = (overrides: Partial<LoginDto> = {}): LoginDto =>
    Object.assign(new LoginDto(), { email: 'e@example.com', password: 'Password#1', ...overrides });

  const createRefreshDto = (overrides: Partial<RefreshTokenDto> = {}): RefreshTokenDto =>
    Object.assign(new RefreshTokenDto(), overrides);

  const createRegisterDto = (overrides: Partial<RegisterDto> = {}): RegisterDto =>
    Object.assign(new RegisterDto(), { email: 'e@example.com', password: 'Password#1', ...overrides });

  const createPasswordChangeDto = (overrides: Partial<PasswordChangeDto> = {}): PasswordChangeDto =>
    Object.assign(new PasswordChangeDto(), { currentPassword: 'Old#1Password', newPassword: 'New#1Password', ...overrides });

  const createRecoveryDto = (code: string): VerifyRecoveryDto => Object.assign(new VerifyRecoveryDto(), { code });

  const createRequestWithCookie = (cookieHeader?: string): ExpressRequest =>
    ({ headers: cookieHeader ? { cookie: cookieHeader } : {} } as unknown as ExpressRequest);

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
      validateOwnerInvite: jest.fn(),
      completeOwnerRegistration: jest.fn(),
      validateStaffInvite: jest.fn(),
      completeStaffRegistration: jest.fn(),
      requestEmailChange: jest.fn(),
      confirmEmailChange: jest.fn(),
      changePassword: jest.fn(),
      unlinkSocialAccount: jest.fn(),
      linkSocialAccount: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    webAuthn = {
      startRegistration: jest.fn(),
      finishRegistration: jest.fn(),
      startAuthentication: jest.fn(),
      finishAuthentication: jest.fn(),
    } as unknown as jest.Mocked<WebAuthnPort>;
    recovery = {
      generate: jest.fn(),
      verifyAndConsume: jest.fn(),
    } as unknown as jest.Mocked<RecoveryCodesPort>;
    oauth = {
      start: jest.fn(),
      exchangeCode: jest.fn(),
    } as unknown as jest.Mocked<OAuthPort>;
    cookies = {
      issue: jest.fn(),
      rotateOnRefresh: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<AuthCookiesService>;
    service.resolveUserIdByEmail.mockResolvedValue('u-by-email');
    controller = new AuthController(service, webAuthn, recovery, oauth, cookies);
  });

  it('signIn sets CSRF and auth cookies when no TOTP', async () => {
    service.signIn.mockResolvedValue({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' });
    const result = await controller.signIn(createLoginDto());
    expect(result).toEqual({ totpRequired: false });
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at', refreshToken: 'rt' }));
  });

  it('signIn returns temp token when TOTP required', async () => {
    service.signIn.mockResolvedValue({ totpRequired: true, tempToken: 'temp' });
    const result = await controller.signIn(createLoginDto());
    expect(result).toEqual({ totpRequired: true, tempToken: 'temp' });
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('refresh rotates cookies and returns empty body', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' });
    const req1 = createRequestWithCookie('bsaas_rt=old');
    const result = await controller.refresh(createRefreshDto(), req1);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'new-at', refreshToken: 'new-rt' }));
  });

  it('refresh reads token from body when cookie missing', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'at2', refreshToken: 'rt2' });
    const req2 = createRequestWithCookie();
    const result = await controller.refresh(createRefreshDto({ refreshToken: 'from-body' }), req2);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at2', refreshToken: 'rt2' }));
  });

  it('refresh falls back to body when cookie header present but no refreshToken pair', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'at3', refreshToken: 'rt3' });
    const req3 = createRequestWithCookie('foo=bar; XSRF-TOKEN=abc');
    const result = await controller.refresh(createRefreshDto({ refreshToken: 'from-body-2' }), req3);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'at3', refreshToken: 'rt3' }));
  });

  it('refresh throws when service returns no refreshToken', async () => {
    service.refreshToken.mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<AuthService['refreshToken']>>,
    );
    const req4 = createRequestWithCookie('');
    await expect(controller.refresh(createRefreshDto({ refreshToken: 'body' }), req4)).rejects.toThrow();
    expect(cookies.issue).not.toHaveBeenCalled();
  });

  it('refresh throws when no token provided', async () => {
    const req6 = createRequestWithCookie();
    await expect(controller.refresh(createRefreshDto(), req6)).rejects.toThrow();
  });

  it('refresh throws when cookie has empty bsaas_rt value', async () => {
    const req7 = createRequestWithCookie('bsaas_rt=');
    await expect(controller.refresh(createRefreshDto(), req7)).rejects.toThrow();
  });

  it('refresh prefers cookie refreshToken over body when present', async () => {
    service.refreshToken.mockResolvedValue({ accessToken: 'newA', refreshToken: 'newR' });
    const req8 = createRequestWithCookie('refreshToken=a%2Fb');
    const result = await controller.refresh(createRefreshDto({ refreshToken: 'BODY-IGNORED' }), req8);
    expect(result).toEqual({});
    expect(cookies.rotateOnRefresh).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'newA', refreshToken: 'newR' }));
  });

  it('webauthnLoginStart throws without identity', async () => {
    await expect(controller.webauthnLoginStart({}, undefined)).rejects.toThrow();
  });

  it('webauthnLoginStart resolves user by email when unauthenticated', async () => {
    service.resolveUserIdByEmail.mockResolvedValueOnce('u-by-email');
    webAuthn.startAuthentication.mockResolvedValue({ request: true } as Record<string, unknown>);
    const req = await controller.webauthnLoginStart({ email: 'e@example.com' }, undefined as unknown as AuthenticatedUser);
    expect(req).toBeDefined();
  });

  it('logout clears cookie and calls service', async () => {
    await controller.logout({ user: { sessionId: 's1' } });
    expect(service.logout).toHaveBeenCalledWith('s1');
    expect(cookies.clear).toHaveBeenCalled();
  });

  it('listSessions proxies to service', async () => {
    service.listSessions.mockResolvedValue([{ id: 's1' }]);
    const result = await controller.listSessions({ user: { userId: 'u1' } });
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('revokeSession proxies to service', async () => {
    service.revokeSession.mockResolvedValue({ success: true });
    const result = await controller.revokeSession({ user: { userId: 'u1' } }, 's1');
    expect(result).toEqual({ success: true });
  });

  it('revokeSessionBody proxies to service', async () => {
    service.revokeSession.mockResolvedValue({ success: true });
    const ok = await controller.revokeSessionBody({ user: { userId: 'u1' } }, { id: 's1' });
    expect(ok).toEqual({ success: true });
  });

  it('changePassword proxies to service', async () => {
    service.changePassword.mockResolvedValue(undefined);
    const dto = createPasswordChangeDto({ currentPassword: 'Old#1', newPassword: 'New#1Password' });
    const ok = await controller.changePassword(dto, { user: { userId: 'u1' } });
    expect(service.changePassword).toHaveBeenCalledWith('u1', dto.currentPassword, dto.newPassword);
    expect(ok).toEqual({ success: true });
  });

  it('devices alias proxies to listSessions', async () => {
    service.listSessions.mockResolvedValue([{ id: 's1' }]);
    const result = await controller.listDevicesAlias({ user: { userId: 'u1' } });
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('recovery-codes issue alias proxies to recovery.generate', async () => {
    recovery.generate.mockResolvedValue(['c1', 'c2']);
    const res = await controller.issueRecoveryCodesAlias({ user: { userId: 'u1' } });
    expect(res).toEqual(['c1', 'c2']);
  });

  it('recovery-codes verify alias returns success', async () => {
    recovery.verifyAndConsume.mockResolvedValue(true);
    const ok = await controller.verifyRecoveryAlias(createRecoveryDto('ok'), { user: { userId: 'u1' } });
    expect(ok).toEqual({ success: true });
  });

  it('revokeSessionDelete proxies to service', async () => {
    service.revokeSession.mockResolvedValue({ success: true });
    const ok = await controller.revokeSessionDelete({ user: { userId: 'u1' } }, 's1');
    expect(ok).toEqual({ success: true });
  });

  it('devices revoke alias proxies to service', async () => {
    service.revokeSession.mockResolvedValue({ success: true });
    const ok = await controller.revokeDeviceAlias({ user: { userId: 'u1' } }, { id: 's1' });
    expect(ok).toEqual({ success: true });
  });

  it('customer register calls service and returns success', async () => {
    service.register.mockResolvedValue(undefined);
    const ok = await controller.register(createRegisterDto());
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
    service.requestEmailVerification.mockResolvedValue(undefined);
    const ok = await controller.emailVerifyRequest({ email: 'e' });
    expect(ok).toEqual({ success: true });
  });

  it('emailVerifyConfirm handles token and otp branches and throws on bad input', async () => {
    service.verifyEmail.mockResolvedValue(undefined);
    const ok1 = await controller.emailVerifyConfirm({ token: 't' });
    expect(ok1).toEqual({ success: true });

    service.verifyEmailOtp.mockResolvedValue(undefined);
    const ok2 = await controller.emailVerifyConfirm({ email: 'e', otp: '123456' });
    expect(ok2).toEqual({ success: true });

    await expect(controller.emailVerifyConfirm({} as { token?: string; email?: string; otp?: string })).rejects.toThrow();
  });

  it('validateOwnerInvite returns valid with email and salonId', async () => {
    service.validateOwnerInvite.mockResolvedValue({ email: 'o@example.com', salonId: 'salon-1' });
    const res = await controller.validateOwnerInvite('token-owner');
    expect(res).toEqual({ valid: true, email: 'o@example.com', salonId: 'salon-1' });
  });

  it('completeOwnerRegistration issues cookies on success and returns empty body', async () => {
    service.completeOwnerRegistration.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    const res = await controller.completeOwnerRegistration({ token: 't', password: 'P#1x' } as RegistrationCompleteInput);
    expect(res).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'a', refreshToken: 'r' }));
  });

  it('completeOwnerRegistration returns next:mfa branch when required', async () => {
    service.completeOwnerRegistration.mockResolvedValue({ next: 'mfa' } as { next: 'mfa' });
    const res = await controller.completeOwnerRegistration({ token: 't', password: 'P#1x' } as RegistrationCompleteInput);
    expect(res).toEqual({ next: 'mfa' });
    expect(cookies.issue).not.toHaveBeenCalled();
  });

  it('validateStaffInvite returns valid with email and salonId', async () => {
    service.validateStaffInvite.mockResolvedValue({ email: 's@example.com', salonId: 'salon-1' });
    const res = await controller.validateStaffInvite('token-staff');
    expect(res).toEqual({ valid: true, email: 's@example.com', salonId: 'salon-1' });
  });

  it('completeStaffRegistration issues cookies on success', async () => {
    service.completeStaffRegistration.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    const res = await controller.completeStaffRegistration({ token: 't', password: 'P#1x' } as RegistrationCompleteInput);
    expect(res).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'a', refreshToken: 'r' }));
  });

  it('completeStaffRegistration returns next:mfa branch when required', async () => {
    service.completeStaffRegistration.mockResolvedValue({ next: 'mfa' } as { next: 'mfa' });
    const res = await controller.completeStaffRegistration({ token: 't', password: 'P#1x' } as RegistrationCompleteInput);
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
