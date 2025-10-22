import { AuthController } from './auth.controller';
import type { WebAuthnPort, RecoveryCodesPort, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';

describe('AuthController OAuth endpoints (unit)', () => {
  let controller: AuthController;
  let authSvc: jest.Mocked<Pick<AuthService, 'linkSocialAccount' | 'unlinkSocialAccount' | 'signInWithSocial' | 'logout' | 'revokeSession' | 'listSessions'>>;
  let oauth: jest.Mocked<Pick<OAuthPort, 'start' | 'exchangeCode'>>;
  let webAuthn: jest.Mocked<Pick<WebAuthnPort, never>>;
  let recovery: jest.Mocked<Pick<RecoveryCodesPort, never>>;
  let cookies: jest.Mocked<Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>>;

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
    webAuthn = {} as unknown as jest.Mocked<Pick<WebAuthnPort, never>>;
    recovery = {} as unknown as jest.Mocked<Pick<RecoveryCodesPort, never>>;
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() } as unknown as jest.Mocked<Pick<AuthCookiesService, 'issue' | 'rotateOnRefresh' | 'clear'>>;
    controller = new AuthController(authSvc as unknown as AuthService, webAuthn as unknown as WebAuthnPort, recovery as unknown as RecoveryCodesPort, oauth as unknown as OAuthPort, cookies as unknown as AuthCookiesService);
  });

  it('oauthStart returns redirect instruction with 302', async () => {
    const out = await controller.oauthStart('google');
    expect(oauth.start).toHaveBeenCalledWith('google');
    expect(out.statusCode).toBe(302);
    expect(out.url).toContain('https://');
  });

  it('oauthCallback throws on missing code', async () => {
    await expect(controller.oauthCallback('google', undefined, undefined, undefined)).rejects.toBeTruthy();
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
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT' }));
  });

  it('oauthUnlink unlinks and returns success', async () => {
    const ok = await controller.oauthUnlink('google', { user: { userId: 'u1' } });
    expect(authSvc.unlinkSocialAccount).toHaveBeenCalledWith('u1', 'google');
    expect(ok).toEqual({ success: true });
  });


});
