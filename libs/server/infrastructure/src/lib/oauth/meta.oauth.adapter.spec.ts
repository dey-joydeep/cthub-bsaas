import { MetaOAuthAdapter } from './meta.oauth.adapter';
import { ConfigService } from '@cthub-bsaas/server-core';
import type { OAuthStateStore } from './state.store';

describe('MetaOAuthAdapter', () => {
  const cfg = {
    get: (k: string) =>
      ({
        META_CLIENT_ID: 'mid',
        META_CLIENT_SECRET: 'msecret',
        META_REDIRECT_URI: 'http://localhost/callback',
        OAUTH_STATE_TTL: '600',
      })[k],
  } as unknown as ConfigService;

  const stateStore: OAuthStateStore = {
    set: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (stateStore.consume as jest.Mock).mockResolvedValue(true);
    (stateStore.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('builds a Meta auth URL with state and nonce', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    const start = await adapter.start('meta');
    expect(start.redirectUrl).toContain('client_id=mid');
    expect(start.redirectUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%2Fcallback');
    expect(start.redirectUrl).toContain('state=');
  });

  it('throws on unsupported provider', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    await expect(adapter.start('google')).rejects.toThrow('oauth.unsupported_provider');
  });

  it('throws when misconfigured (missing clientId)', async () => {
    const badCfg = { get: (_: string) => undefined } as unknown as ConfigService;
    const adapter = new MetaOAuthAdapter(badCfg, stateStore);
    await expect(adapter.start('meta')).rejects.toThrow('oauth.meta.misconfigured');
  });

  it('throws invalid_state when state is missing or not consumed', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    await expect(adapter.exchangeCode('meta', 'code', undefined)).rejects.toThrow('oauth.invalid_state');
    (stateStore.consume as jest.Mock).mockResolvedValueOnce(false);
    await expect(adapter.exchangeCode('meta', 'code', 'state')).rejects.toThrow('oauth.invalid_state');
  });

  it('throws unsupported provider on exchange', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    await expect(adapter.exchangeCode('google' as unknown as 'meta', 'code', 'state')).rejects.toThrow('oauth.unsupported_provider');
  });

  it('throws misconfigured during exchange (missing clientSecret)', async () => {
    const badCfg = { get: (_: string) => undefined } as unknown as ConfigService;
    const adapter = new MetaOAuthAdapter(badCfg, stateStore);
    await expect(adapter.exchangeCode('meta', 'code', 'state')).rejects.toThrow('oauth.meta.misconfigured');
  });

  it('handles missing access_token in token response', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    const orig = globalThis.fetch;
    globalThis.fetch = jest
      .fn()
      // token OK but missing access_token
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) as unknown as typeof globalThis.fetch;
    await expect(adapter.exchangeCode('meta', 'code', 'state')).rejects.toThrow('oauth.meta.access_token_missing');
    globalThis.fetch = orig;
  });

  it('exchanges code and returns profile', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    const fetchMock = jest
      .fn()
      // token response
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'AT' }) })
      // debug_token response
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { user_id: 'meta-uid-1' } }) });
    const orig = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    const profile = await adapter.exchangeCode('meta', 'code', 'state');
    expect(profile).toEqual({ provider: 'meta', providerUserId: 'meta-uid-1' });
    globalThis.fetch = orig;
  });

  it('handles token exchange failure', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    const orig = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    await expect(adapter.exchangeCode('meta', 'code', 'state')).rejects.toThrow('oauth.meta.token_exchange_failed');
    globalThis.fetch = orig;
  });

  it('handles debug_token failure and missing user id', async () => {
    const adapter = new MetaOAuthAdapter(cfg, stateStore);
    const orig = globalThis.fetch;
    // failure path
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'AT' }) })
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) }) as unknown as typeof globalThis.fetch;
    await expect(adapter.exchangeCode('meta', 'code', 'state')).rejects.toThrow('oauth.meta.debug_token_failed');

    // missing user id
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'AT' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: {} }) }) as unknown as typeof globalThis.fetch;
    await expect(adapter.exchangeCode('meta', 'code', 'state')).rejects.toThrow('oauth.meta.user_id_missing');
    globalThis.fetch = orig;
  });
});
