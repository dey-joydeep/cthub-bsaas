import { AuthController } from './auth.controller';
import type { WebAuthnPort, RecoveryCodesPort, OAuthPort } from '@cthub-bsaas/server-contracts-auth';
import { AuthService } from '../services/auth.service';
import { AuthCookiesService } from '../services/auth-cookies.service';

describe('AuthController OAuth endpoints (unit)', () => {
  let controller: AuthController;
  let authSvc: jest.Mocked<
    Pick<
      AuthService,
      'linkSocialAccount' | 'unlinkSocialAccount' | 'signInWithSocial' | 'logout' | 'revokeSession' | 'listSessions'
    >
  >;
  let oauth: jest.Mocked<Pick<OAuthPort, 'start' | 'exchangeCode'>>;
  const webAuthn = {} as unknown as jest.Mocked<WebAuthnPort>;
  const recovery = {} as unknown as jest.Mocked<RecoveryCodesPort>;
  let cookies: jest.Mocked<AuthCookiesService>;

  beforeEach(() => {
    authSvc = {
      linkSocialAccount: jest.fn(() => {}),
      signInWithSocial: jest.fn(() => ({ accessToken: 'AT', refreshToken: 'RT' })),
      logout: jest.fn(() => {}),
      revokeSession: jest.fn(() => ({ success: true } as const)),
      listSessions: jest.fn(() => []),
      unlinkSocialAccount: jest.fn(() => {}),
    } as unknown as typeof authSvc;
    oauth = {
      start: jest.fn(() => ({ redirectUrl: 'https://example.com/oauth' })),
      exchangeCode: jest.fn(() => ({ provider: 'google', providerUserId: 'pid' })),
    } as unknown as typeof oauth;
    cookies = { issue: jest.fn(), rotateOnRefresh: jest.fn(), clear: jest.fn() } as unknown as jest.Mocked<AuthCookiesService>;
    controller = new AuthController(authSvc as unknown as AuthService, webAuthn, recovery, (oauth as unknown) as OAuthPort, cookies);
  });

  it('oauthStart returns redirect instruction with 302', async () => {
    const out = await controller.oauthStart('google');
    expect(oauth.start).toHaveBeenCalledWith('google');
    expect(out.statusCode).toBe(302);
    expect(out.url).toContain('https://');
  });

  it('oauthCallback throws on missing code', async () => {
    await expect(controller.oauthCallback('google', {}, undefined, undefined)).rejects.toBeTruthy();
  });

  it('oauthCallback links provider when user is authenticated', async () => {
    const out = await controller.oauthCallback('google', { user: { userId: 'u1' } }, 'c', 's');
    expect(oauth.exchangeCode).toHaveBeenCalledWith('google', 'c', 's');
    expect(authSvc.linkSocialAccount).toHaveBeenCalledWith('u1', 'google', 'pid');
    expect(out).toEqual({});
  });

  it('oauthCallback signs in unauthenticated user and sets cookies', async () => {
    const out = await controller.oauthCallback('google', {}, 'code123', 'state');
    expect(out).toEqual({});
    expect(authSvc.signInWithSocial).toHaveBeenCalled();
    expect(cookies.issue).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'AT', refreshToken: 'RT', csrf: expect.any(String) }));
  });

  it('oauthUnlink unlinks and returns success', async () => {
    const ok = await controller.oauthUnlink('google', { user: { userId: 'u1' } });
    expect(authSvc.unlinkSocialAccount).toHaveBeenCalledWith('u1', 'google');
    expect(ok).toEqual({ success: true });
  });
});
