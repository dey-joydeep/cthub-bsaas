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


  const createRequestWithCookie = (cookieHeader?: string): ExpressRequest =>
    ({ headers: cookieHeader ? { cookie: cookieHeader } : {} } as unknown as ExpressRequest);

  beforeEach(() => {
    service = {
      signIn: jest.fn().mockResolvedValue({ totpRequired: false, accessToken: 'at', refreshToken: 'rt' }),
      refreshToken: jest.fn().mockResolvedValue({ accessToken: 'new-at', refreshToken: 'new-rt' }),
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
      requestEmailChange: jest.fn().mockResolvedValue(undefined),
      confirmEmailChange: jest.fn().mockResolvedValue(undefined),
      changePassword: jest.fn().mockResolvedValue(undefined),
      unlinkSocialAccount: jest.fn().mockResolvedValue(undefined),
      linkSocialAccount: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuthService>;
    webAuthn = {
      startRegistration: jest.fn().mockResolvedValue({ ok: 1 } as Record<string, unknown>),
      finishRegistration: jest.fn().mockResolvedValue({ credentialId: 'cid', counter: 0 }),
      startAuthentication: jest.fn().mockResolvedValue({ request: true } as Record<string, unknown>),
      finishAuthentication: jest.fn().mockResolvedValue({ credentialId: 'cid', counter: 1 }),
    } as unknown as jest.Mocked<WebAuthnPort>;
    recovery = {
      generate: jest.fn().mockResolvedValue(['r1', 'r2']),
      verifyAndConsume: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<RecoveryCodesPort>;
    oauth = {
      start: jest.fn().mockResolvedValue({ redirectUrl: 'https://example.com/oauth' }),
      exchangeCode: jest.fn().mockResolvedValue({ provider: 'google', providerUserId: 'pid' }),
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

  it('refresh rejects when both cookie and body tokens are provided', async () => {
    const req = createRequestWithCookie('bsaas_rt=cookie');
    await expect(controller.refresh(createRefreshDto({ refreshToken: 'from-body' }), req)).rejects.toThrow();
    expect(cookies.rotateOnRefresh).not.toHaveBeenCalled();
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


  it('changePassword proxies to service', async () => {
    service.changePassword.mockResolvedValue(undefined);
    const dto = createPasswordChangeDto({ currentPassword: 'Old#1', newPassword: 'New#1Password' });
    const ok = await controller.changePassword(dto, { user: { userId: 'u1' } });
    expect(service.changePassword).toHaveBeenCalledWith('u1', dto.currentPassword, dto.newPassword);
    expect(ok).toEqual({ success: true });
  });






  it('customer register calls service and returns success', async () => {
    service.register.mockResolvedValue(undefined);
    const ok = await controller.register(createRegisterDto());
    expect(ok).toEqual({ success: true });
    expect(service.register).toHaveBeenCalled();
  });

  it('forgot/reset flows call service and return success', async () => {
    service.requestPasswordReset.mockResolvedValue(undefined);
    const forgot = await controller.forgotPassword({ email: 'e' });
    expect(forgot).toEqual({ success: true });

    service.resetPassword.mockResolvedValue(undefined);
    const reset = await controller.resetPassword({ token: 't', newPassword: 'p' });
    expect(reset).toEqual({ success: true });
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
