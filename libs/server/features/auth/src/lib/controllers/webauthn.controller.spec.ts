import { WebauthnController } from './webauthn.controller';
import type { WebAuthnPort } from '@cthub-bsaas/server-contracts-auth';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { WebauthnRegisterStartDto } from '../dto/webauthn-register-start.dto';
import type { WebauthnAttestationDto } from '../dto/webauthn-attestation.dto';
import type { WebauthnAssertionDto } from '../dto/webauthn-assertion.dto';


const makeWebAuthn = () => ({
  startRegistration: jest.fn((_userId: string, _username: string) => Promise.resolve({ challenge: 'reg' })),
  finishRegistration: jest.fn((_userId: string, _resp: unknown) => Promise.resolve(undefined)),
  startAuthentication: jest.fn((_userId: string) => Promise.resolve({ challenge: 'auth' })),
  finishAuthentication: jest.fn((_userId: string, _resp: unknown) => Promise.resolve(undefined)),
});

const makeAuthService = () => ({
  resolveUserIdByEmail: jest.fn((_email: string) => Promise.resolve('by-email')),
  issueTokensForUser: jest.fn((_userId: string) => Promise.resolve({ accessToken: 'AT', refreshToken: 'RT' })),
});

const makeCookies = () => ({ issue: jest.fn() });
const makeJwt = () => ({ decode: jest.fn(() => ({ roles: ['CUSTOMER'] })) });

describe('WebauthnController (unit)', () => {
  let controller: WebauthnController;
  let webAuthn: ReturnType<typeof makeWebAuthn>;
  let authService: ReturnType<typeof makeAuthService>;
  let cookies: ReturnType<typeof makeCookies>;
  let jwt: ReturnType<typeof makeJwt>;

  beforeEach(() => {
    webAuthn = makeWebAuthn();
    authService = makeAuthService();
    cookies = makeCookies();
    jwt = makeJwt();
    controller = new WebauthnController(
      webAuthn as unknown as WebAuthnPort,
      authService as unknown as AuthService,
      cookies as unknown as AuthCookiesService,
      jwt as unknown as any,
    );
  });

  it('register start delegates to adapter', async () => {
    const out = await controller.webauthnRegisterStart({ username: 'Device' } as WebauthnRegisterStartDto, { user: { userId: 'u1' } });
    expect(webAuthn.startRegistration).toHaveBeenCalledWith('u1', 'Device');
    expect(out).toEqual({ challenge: 'reg' });
  });

  it('register finish returns success after adapter call', async () => {
    const out = await controller.webauthnRegisterFinish({ response: {} } as WebauthnAttestationDto, { user: { userId: 'u1' } });
    expect(webAuthn.finishRegistration).toHaveBeenCalled();
    expect(out).toEqual({ success: true });
  });

  it('login start via OptionalUser userId', async () => {
    const user = { id: 'u1', userId: 'u1' } as unknown as AuthenticatedUser;
    const out = await controller.webauthnLoginStart({}, user);
    expect(webAuthn.startAuthentication).toHaveBeenCalledWith('u1');
    expect(out).toEqual({ challenge: 'auth' });
  });

  it('login start via email payload', async () => {
    const out = await controller.webauthnLoginStart({ email: 'e@example.com' }, undefined);
    expect(authService.resolveUserIdByEmail).toHaveBeenCalledWith('e@example.com');
    expect(webAuthn.startAuthentication).toHaveBeenCalledWith('by-email');
    expect(out).toEqual({ challenge: 'auth' });
  });

  it('login start via explicit userId payload', async () => {
    const out = await controller.webauthnLoginStart({ userId: 'payload-id' }, undefined);
    expect(webAuthn.startAuthentication).toHaveBeenCalledWith('payload-id');
    expect(out).toEqual({ challenge: 'auth' });
  });

  it('login start uses fallback id when userId missing on OptionalUser', async () => {
    const user = { id: 'fallback-id' } as unknown as AuthenticatedUser;
    const out = await controller.webauthnLoginStart({}, user);
    expect(webAuthn.startAuthentication).toHaveBeenCalledWith('fallback-id');
    expect(out).toEqual({ challenge: 'auth' });
  });

  it('login start rejects on missing email and userId', async () => {
    await expect(controller.webauthnLoginStart({}, undefined)).rejects.toThrow(BadRequestException);
  });

  it('login start rejects when body is undefined (nullish coalesce branch)', async () => {
    await expect(controller.webauthnLoginStart(undefined as unknown as { email?: string; userId?: string }, undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('login finish throws Unauthorized if OptionalUser missing', () => {
    expect(() => controller.webauthnLoginFinish({ response: {} } as WebauthnAssertionDto, undefined)).toThrow(UnauthorizedException);
  });

  it('login finish throws Unauthorized when user id is empty (extract fallback branch)', () => {
    const user = { id: '' } as unknown as AuthenticatedUser;
    expect(() => controller.webauthnLoginFinish({ response: {} } as WebauthnAssertionDto, user)).toThrow(UnauthorizedException);
  });

  it('login finish issues tokens and cookies', async () => {
    const user = { id: 'u1' } as unknown as AuthenticatedUser;
    const out = await controller.webauthnLoginFinish({ response: {} } as WebauthnAssertionDto, user);
    expect(webAuthn.finishAuthentication).toHaveBeenCalled();
    expect(authService.issueTokensForUser).toHaveBeenCalledWith('u1');
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }),
      expect.any(Object),
    );
    expect(out).toEqual({});
  });

  it('login finish uses default TTL branch when roles not customer', async () => {
    (jwt.decode as jest.Mock).mockReturnValueOnce({ roles: [] });
    const user = { id: 'u1' } as unknown as AuthenticatedUser;
    const out = await controller.webauthnLoginFinish({ response: {} } as WebauthnAssertionDto, user);
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('login finish handles non-array roles', async () => {
    (jwt.decode as jest.Mock).mockReturnValueOnce({ roles: 'x' as unknown as string[] });
    const user = { id: 'u1' } as unknown as AuthenticatedUser;
    const out = await controller.webauthnLoginFinish({ response: {} } as WebauthnAssertionDto, user);
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('login finish handles decode null safely', async () => {
    (jwt.decode as jest.Mock).mockReturnValueOnce(null as any);
    const user = { id: 'u1' } as unknown as AuthenticatedUser;
    const out = await controller.webauthnLoginFinish({ response: {} } as WebauthnAssertionDto, user);
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });
});
