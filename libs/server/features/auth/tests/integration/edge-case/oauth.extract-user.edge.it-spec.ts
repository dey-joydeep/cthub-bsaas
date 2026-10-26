import { OauthController } from '../../../src/lib/controllers/oauth.controller';
import type { OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { AuthService } from '../../../src/lib/services/auth.service';
import type { AuthCookiesService } from '../../../src/lib/services/auth-cookies.service';
import type { JwtService } from '@nestjs/jwt';

/**
 * Edge-case coverage: exercise OauthController.extractUserId() branches
 * and a couple of oauthCallback branches for IT coverage.
 */
describe('OAuth extractUserId edge cases (integration harness)', () => {
  let controller: OauthController;
  let oauth: Pick<OAuthPort, 'exchangeCode' | 'start'>;
  let authSvc: Pick<AuthService, 'linkSocialAccount' | 'signInWithSocial'>;
  let cookies: Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>;
  let jwt: Pick<JwtService, 'decode'>;
  let decodeMock: jest.Mock;

  beforeAll(() => {
    oauth = {
      exchangeCode: jest.fn(async () => ({ provider: 'google', providerUserId: 'pid' })),
      start: jest.fn(async () => ({ redirectUrl: 'https://example.com/oauth' })),
    };
    authSvc = {
      linkSocialAccount: jest.fn(async () => undefined),
      signInWithSocial: jest.fn(async () => ({ accessToken: 'AT', refreshToken: 'RT' })),
    };
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() };
    decodeMock = jest.fn(() => ({ roles: ['CUSTOMER'] }));
    jwt = { decode: decodeMock as unknown as JwtService['decode'] };
    controller = new OauthController(
      oauth as OAuthPort,
      authSvc as unknown as import('../../../src/lib/services/auth.service').AuthService,
      cookies as unknown as import('../../../src/lib/services/auth-cookies.service').AuthCookiesService,
      jwt as unknown as JwtService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts `id` when `userId` is absent on OptionalUser', () => {
    const extractor = (controller as unknown as { extractUserId: (u?: AuthenticatedUser) => string | undefined }).extractUserId;
    expect(extractor({ id: 'fallback-id' } as unknown as AuthenticatedUser)).toBe('fallback-id');
  });

  it('extracts `userId` when present on OptionalUser', () => {
    const extractor = (controller as unknown as { extractUserId: (u?: AuthenticatedUser) => string | undefined }).extractUserId;
    expect(extractor({ userId: 'primary-id' } as unknown as AuthenticatedUser)).toBe('primary-id');
  });

  it('returns undefined when candidate is not a non-empty string', () => {
    const extractor = (controller as unknown as { extractUserId: (u?: AuthenticatedUser) => string | undefined }).extractUserId;
    expect(extractor({ id: '' } as unknown as AuthenticatedUser)).toBeUndefined();
    expect(extractor(undefined)).toBeUndefined();
  });

  it('oauthStart returns redirect 302', async () => {
    const res = await controller.oauthStart('google');
    expect(oauth.start).toHaveBeenCalledWith('google');
    expect(res.statusCode).toBe(302);
    expect(res.url).toContain('https://');
  });

  it('oauthCallback throws 400 when code is missing', () => {
    expect(() => controller.oauthCallback('google', undefined, undefined, undefined)).toThrow();
  });

  it('oauthCallback signs in unauthenticated and sets cookies with isCustomer true', async () => {
    const out = await controller.oauthCallback('google', undefined, 'code123', 'state');
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }),
      expect.objectContaining({ isCustomer: true }),
    );
  });

  it('oauthCallback signs in unauthenticated and sets cookies with isCustomer false when roles do not include CUSTOMER', async () => {
    decodeMock.mockReturnValueOnce({ roles: [] });
    const out = await controller.oauthCallback('google', undefined, 'code123', 'state');
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }),
      expect.objectContaining({ isCustomer: false }),
    );
  });

  it('oauthCallback links provider when user is authenticated', async () => {
    const out = await controller.oauthCallback(
      'google',
      { userId: 'u1' } as unknown as import('@cthub-bsaas/shared').AuthenticatedUser,
      'c',
      's',
    );
    expect(out).toEqual({});
    expect(authSvc.linkSocialAccount).toHaveBeenCalledWith('u1', 'google', 'pid');
  });
});
