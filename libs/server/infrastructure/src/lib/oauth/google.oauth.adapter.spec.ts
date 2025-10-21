import { GoogleOAuthAdapter } from './google.oauth.adapter';
import type { ConfigService } from '@cthub-bsaas/server-core';
import type { OAuthStateStore } from './state.store';

jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        getToken: jest.fn().mockResolvedValue({ tokens: { id_token: 'header.payload.sig' } }),
        verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({ sub: 'google-user-123' }) }),
      };
    }),
  };
});

describe('GoogleOAuthAdapter', () => {
  const cfg = {
    get: (k: string) => ({
      GOOGLE_CLIENT_ID: 'gid',
      GOOGLE_CLIENT_SECRET: 'gsecret',
      GOOGLE_REDIRECT_URI: 'http://localhost/callback',
      OAUTH_STATE_TTL: '600',
    }[k]),
  } as unknown as ConfigService;

  const stateStore: OAuthStateStore = {
    set: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(true),
  };

  it('builds a Google auth URL with state and nonce, persists state, and exchanges code', async () => {
    const adapter = new GoogleOAuthAdapter(cfg, stateStore);
    const start = await adapter.start('google');
    expect(start.redirectUrl).toContain('client_id=gid');
    expect(start.redirectUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%2Fcallback');
    expect(start.redirectUrl).toContain('state=');
    expect((stateStore.set as jest.Mock).mock.calls.length).toBe(1);

    const profile = await adapter.exchangeCode('google', 'code123', start.state);
    expect(profile).toEqual({ provider: 'google', providerUserId: 'google-user-123' });
  });

  it('throws on unsupported provider', async () => {
    const adapter = new GoogleOAuthAdapter(cfg, stateStore);
    await expect(adapter.start('meta')).rejects.toThrow('oauth.unsupported_provider');
  });

  it('throws when misconfigured (missing clientId)', async () => {
    const badCfg = { get: (_: string) => (undefined) } as unknown as ConfigService;
    const adapter = new GoogleOAuthAdapter(badCfg, stateStore);
    await expect(adapter.start('google')).rejects.toThrow('oauth.google.misconfigured');
  });

  it('throws on invalid state during exchange', async () => {
    const adapter = new GoogleOAuthAdapter(cfg, stateStore);
    await expect(adapter.exchangeCode('google', 'code123', undefined)).rejects.toThrow('oauth.invalid_state');
    (stateStore.consume as jest.Mock).mockResolvedValueOnce(false);
    await expect(adapter.exchangeCode('google', 'code123', 'state')).rejects.toThrow('oauth.invalid_state');
  });

  it('throws when id_token is missing from token response', async () => {
    const adapter = new GoogleOAuthAdapter(cfg, stateStore);
    (stateStore.consume as jest.Mock).mockResolvedValueOnce(true);
    const client = (adapter as unknown as {
      client: { getToken: jest.Mock; verifyIdToken: jest.Mock };
    }).client;
    client.getToken.mockResolvedValue({ tokens: {} });
    await expect(adapter.exchangeCode('google', 'code123', 'state')).rejects.toThrow('oauth.google.id_token_missing');
  });

  it('throws when ID token payload has no sub', async () => {
    const adapter = new GoogleOAuthAdapter(cfg, stateStore);
    (stateStore.consume as jest.Mock).mockResolvedValueOnce(true);
    const client = (adapter as unknown as {
      client: { getToken: jest.Mock; verifyIdToken: jest.Mock };
    }).client;
    client.getToken.mockResolvedValue({ tokens: { id_token: 'header.payload.sig' } });
    client.verifyIdToken.mockResolvedValue({ getPayload: () => ({}) });
    await expect(adapter.exchangeCode('google', 'code123', 'state')).rejects.toThrow('oauth.google.invalid_id_token');
  });

  it('throws unsupported provider on exchange', async () => {
    const adapter = new GoogleOAuthAdapter(cfg, stateStore);
    await expect(adapter.exchangeCode('meta' as unknown as 'google', 'code', 'state')).rejects.toThrow(
      'oauth.unsupported_provider',
    );
  });

  it('throws misconfigured during exchange (missing clientSecret)', async () => {
    const badCfg = { get: (_: string) => (undefined) } as unknown as ConfigService;
    const adapter = new GoogleOAuthAdapter(badCfg, stateStore);
    await expect(adapter.exchangeCode('google', 'code', 'state')).rejects.toThrow('oauth.google.misconfigured');
  });
});
