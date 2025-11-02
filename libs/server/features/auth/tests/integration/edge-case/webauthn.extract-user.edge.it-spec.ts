import { WebauthnController } from '../../../src/lib/controllers/webauthn.controller';
import type { WebAuthnPort } from '@cthub-bsaas/server-contracts-auth';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { AuthService } from '../../../src/lib/services/auth.service';
import type { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import type { JwtService } from '@nestjs/jwt';

/**
 * Edge-case coverage: exercise extractUserId() branches where OptionalUser provides only `id`
 * and where the candidate is not a valid non-empty string. Also cover email branch in login start.
 */
describe('WebAuthn extractUserId edge cases (integration harness)', () => {
  let controller: WebauthnController;
  let webAuthn: Pick<WebAuthnPort, 'startAuthentication'>;
  let authSvc: Pick<AuthService, 'resolveUserIdByEmail' | 'issueTokensForUser'>;
  let cookies: Pick<AuthCookiesService, 'issue'>;
  let jwt: Pick<JwtService, 'decode'>;
  let decodeMock: jest.Mock;

  beforeAll(() => {
    webAuthn = { startAuthentication: jest.fn(async () => ({ challenge: 'auth' })) };
    authSvc = { resolveUserIdByEmail: jest.fn(async () => 'uid-by-email'), issueTokensForUser: jest.fn(async () => ({ accessToken: 'AT', refreshToken: 'RT' })) };
    cookies = { issue: jest.fn() };
    decodeMock = jest.fn(() => ({ roles: [] }));
    jwt = { decode: decodeMock as unknown as JwtService['decode'] };
    controller = new WebauthnController(
      webAuthn as WebAuthnPort,
      authSvc as unknown as import('../../../src/lib/services/auth.service').AuthService,
      cookies as unknown as import('../../../src/lib/services/auth-cookies.service').AuthCookiesService,
      jwt as unknown as JwtService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts `id` when `userId` is absent on OptionalUser', () => {
    const user = { id: 'user-xyz' } as unknown as AuthenticatedUser;
    const extractor = (controller as unknown as { extractUserId: (u?: AuthenticatedUser) => string | undefined }).extractUserId;
    const result = extractor.call(controller, user);
    expect(result).toBe('user-xyz');
  });

  it('extracts `userId` when present on OptionalUser', () => {
    const user = { userId: 'user-abc' } as unknown as AuthenticatedUser;
    const extractor = (controller as unknown as { extractUserId: (u?: AuthenticatedUser) => string | undefined }).extractUserId;
    const result = extractor.call(controller, user);
    expect(result).toBe('user-abc');
  });

  it('returns undefined when candidate is not a non-empty string', () => {
    const user = { id: '' } as unknown as AuthenticatedUser;
    const extractor = (controller as unknown as { extractUserId: (u?: AuthenticatedUser) => string | undefined }).extractUserId;
    const result = extractor.call(controller, user);
    expect(result).toBeUndefined();
  });

  it('webauthnLoginStart resolves userId by email when provided', async () => {
    const out = await controller.webauthnLoginStart({ email: 'e@example.com' }, undefined);
    expect(authSvc.resolveUserIdByEmail).toHaveBeenCalledWith('e@example.com');
    expect(webAuthn.startAuthentication).toHaveBeenCalledWith('uid-by-email');
    expect(out).toEqual({ challenge: 'auth' });
  });

  it('webauthnLoginStart uses explicit userId when provided in payload', async () => {
    const out = await controller.webauthnLoginStart({ userId: 'payload-id' }, undefined);
    expect(webAuthn.startAuthentication).toHaveBeenCalledWith('payload-id');
    expect(out).toEqual({ challenge: 'auth' });
  });

  it('webauthnLoginStart rejects when neither user nor email/userId provided', async () => {
    await expect(controller.webauthnLoginStart({}, undefined)).rejects.toThrow();
  });

  it('webauthnLoginStart prefers OptionalUser userId when present', async () => {
    const out = await controller.webauthnLoginStart({}, { userId: 'u-ctx' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser);
    expect(webAuthn.startAuthentication).toHaveBeenCalledWith('u-ctx');
    expect(out).toEqual({ challenge: 'auth' });
  });

  it('webauthnLoginFinish throws when user context is missing', () => {
    expect(() => controller.webauthnLoginFinish({ response: {} } as unknown as import('../../../src/lib/dto/webauthn-assertion.dto').WebauthnAssertionDto, undefined)).toThrow();
  });

  it('webauthnLoginFinish issues cookies on success and computes isCustomer', async () => {
    // Arrange finish + token issuance
    const finishSpy: jest.Mock<Promise<unknown>, unknown[]> = jest.fn(async () => ({}));
    (webAuthn as Record<string, unknown>).finishAuthentication = finishSpy as unknown;
    (authSvc.issueTokensForUser as jest.Mock).mockResolvedValueOnce({ accessToken: 'AT', refreshToken: 'RT' });
    decodeMock.mockReturnValueOnce({ roles: ['CUSTOMER'] });
    // Act
    const out = await controller.webauthnLoginFinish(
      { response: {} } as unknown as import('../../../src/lib/dto/webauthn-assertion.dto').WebauthnAssertionDto,
      { userId: 'u-ctx' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser,
    );
    // Assert
    expect(out).toEqual({});
    expect(finishSpy).toHaveBeenCalled();
    expect(authSvc.issueTokensForUser).toHaveBeenCalledWith('u-ctx');
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }),
      expect.objectContaining({ isCustomer: true }),
    );
  });

  it('webauthnLoginFinish issues cookies with isCustomer false when roles do not include CUSTOMER', async () => {
    const finishSpy: jest.Mock<Promise<unknown>, unknown[]> = jest.fn(async () => ({}));
    (webAuthn as Record<string, unknown>).finishAuthentication = finishSpy as unknown;
    (authSvc.issueTokensForUser as jest.Mock).mockResolvedValueOnce({ accessToken: 'AT', refreshToken: 'RT' });
    decodeMock.mockReturnValueOnce({ roles: [] });
    const out = await controller.webauthnLoginFinish(
      { response: {} } as unknown as import('../../../src/lib/dto/webauthn-assertion.dto').WebauthnAssertionDto,
      { userId: 'u-ctx' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser,
    );
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }),
      expect.objectContaining({ isCustomer: false }),
    );
  });
});
