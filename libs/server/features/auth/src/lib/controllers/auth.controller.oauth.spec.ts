import { OauthController } from './oauth.controller';
import type { OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';
import type { JwtService } from '@nestjs/jwt';

describe('OauthController (unit)', () => {
  let controller: OauthController;
  let authSvc: jest.Mocked<
    Pick<AuthService, 'linkSocialAccount' | 'unlinkSocialAccount' | 'signInWithSocial' | 'logout' | 'revokeSession' | 'listSessions'>
  >;
  let oauth: jest.Mocked<Pick<OAuthPort, 'start' | 'exchangeCode'>>;

  let cookies: jest.Mocked<Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>>;
  let jwt: Pick<JwtService, 'decode'>;
  let decodeMock: jest.Mock;

  beforeEach(() => {
    authSvc = {
      linkSocialAccount: jest.fn(() => Promise.resolve()),
      signInWithSocial: jest.fn(() => Promise.resolve({ accessToken: 'AT', refreshToken: 'RT' })),
      logout: jest.fn(() => Promise.resolve()),
      revokeSession: jest.fn(() => Promise.resolve({ success: true } as const)),
      listSessions: jest.fn(() => Promise.resolve([])),
      unlinkSocialAccount: jest.fn(() => Promise.resolve()),
    } as unknown as typeof authSvc;
    oauth = {
      start: jest.fn(() => Promise.resolve({ redirectUrl: 'https://example.com/oauth' })),
      exchangeCode: jest.fn(() => Promise.resolve({ provider: 'google', providerUserId: 'pid' })),
    } as unknown as typeof oauth;
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() } as unknown as jest.Mocked<
      Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>
    >;
    decodeMock = jest.fn(() => ({ roles: ['CUSTOMER'] }));
    jwt = { decode: decodeMock as unknown as JwtService['decode'] };
    controller = new OauthController(
      oauth as unknown as OAuthPort,
      authSvc as unknown as AuthService,
      cookies as unknown as AuthCookiesService,
      jwt as unknown as JwtService,
    );
  });

  it('oauthStart returns redirect instruction with 302', async () => {
    const out = await controller.oauthStart('google');
    expect(oauth.start).toHaveBeenCalledWith('google');
    expect(out.statusCode).toBe(302);
    expect(out.url).toContain('https://');
  });

  it('oauthCallback throws on missing code', () => {
    expect(() => controller.oauthCallback('google', undefined, undefined, undefined)).toThrow();
  });

  it('oauthCallback links provider when user is authenticated', async () => {
    const out = await controller.oauthCallback('google', { userId: 'u1' } as unknown as AuthenticatedUser, 'c', 's');
    expect(oauth.exchangeCode).toHaveBeenCalledWith('google', 'c', 's');
    expect(authSvc.linkSocialAccount).toHaveBeenCalledWith('u1', 'google', 'pid');
    expect(out).toEqual({});
  });

  it('oauthCallback signs in unauthenticated user and sets cookies', async () => {
    const out = await controller.oauthCallback('google', undefined, 'code123', 'state');
    expect(out).toEqual({});
    expect(authSvc.signInWithSocial).toHaveBeenCalled();
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }), expect.any(Object));
  });

  it('oauthCallback uses default TTL when roles are absent', async () => {
    decodeMock.mockReturnValueOnce({ roles: [] });
    const out = await controller.oauthCallback('google', undefined, 'code123', 'state');
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('oauthCallback treats non-array roles as non-customer', async () => {
    decodeMock.mockReturnValueOnce({ roles: 'x' as unknown as string[] });
    const out = await controller.oauthCallback('google', undefined, 'code123', 'state');
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('oauthCallback handles decode null safely', async () => {
    decodeMock.mockReturnValueOnce(null);
    const out = await controller.oauthCallback('google', undefined, 'code123', 'state');
    expect(out).toEqual({});
    expect(cookies.issue).toHaveBeenCalled();
  });

  it('oauthCallback treats invalid typed user id as unauthenticated (branch)', async () => {
    const out = await controller.oauthCallback('google', { userId: 123 } as unknown as AuthenticatedUser, 'c', 's');
    expect(out).toEqual({});
    expect(authSvc.signInWithSocial).toHaveBeenCalled();
  });

  it('oauthCallback treats empty string id as unauthenticated (branch)', async () => {
    const out = await controller.oauthCallback('google', { userId: '' } as unknown as AuthenticatedUser, 'c', 's');
    expect(out).toEqual({});
    expect(authSvc.signInWithSocial).toHaveBeenCalled();
  });

  it('oauthCallback uses id property when present (link branch)', async () => {
    const out = await controller.oauthCallback('google', { id: 'u2' } as unknown as AuthenticatedUser, 'c', 's');
    expect(out).toEqual({});
    expect(authSvc.linkSocialAccount).toHaveBeenCalledWith('u2', 'google', 'pid');
  });

  it('oauthCallback with user object but no id behaves as unauthenticated', async () => {
    const out = await controller.oauthCallback('google', {} as unknown as AuthenticatedUser, 'c', 's');
    expect(out).toEqual({});
    expect(authSvc.signInWithSocial).toHaveBeenCalled();
  });

  it('oauthUnlink unlinks and returns success', async () => {
    const ok = await controller.oauthUnlink('google', { user: { userId: 'u1' } });
    expect(authSvc.unlinkSocialAccount).toHaveBeenCalledWith('u1', 'google');
    expect(ok).toEqual({ success: true });
  });
});
