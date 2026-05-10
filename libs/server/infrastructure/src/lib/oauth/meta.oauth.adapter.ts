import { Injectable } from '@nestjs/common';
import type { OAuthPort, OAuthStartResult, OAuthProfile } from '@cthub-bsaas/server-contracts-auth';
import { ConfigService } from '@cthub-bsaas/server-core';
import crypto from 'crypto';
import type { OAuthStateStore } from './state.store';

@Injectable()
export class MetaOAuthAdapter implements OAuthPort {
  private readonly ttlSec: number;

  constructor(private readonly config: ConfigService, private readonly stateStore: OAuthStateStore) {
    this.ttlSec = parseInt(this.config.get<string>('OAUTH_STATE_TTL') ?? '600', 10);
  }

  async start(provider: string, _link?: boolean): Promise<OAuthStartResult> {
    if (provider !== 'meta' && provider !== 'facebook') throw new Error('oauth.unsupported_provider');
    const clientId = this.config.get<string>('META_CLIENT_ID');
    const redirectUri = this.config.get<string>('META_REDIRECT_URI');
    if (!clientId || !redirectUri) throw new Error('oauth.meta.misconfigured');
    const nonce = crypto.randomBytes(16).toString('base64url');
    const state = crypto.randomBytes(24).toString('base64url');
    await this.stateStore.set(state, this.ttlSec);
    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'public_profile,email');
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);
    return { redirectUrl: url.toString(), state };
  }

  async exchangeCode(provider: string, code: string, state?: string): Promise<OAuthProfile> {
    if (provider !== 'meta' && provider !== 'facebook') throw new Error('oauth.unsupported_provider');
    const clientId = this.config.get<string>('META_CLIENT_ID');
    const clientSecret = this.config.get<string>('META_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('META_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) throw new Error('oauth.meta.misconfigured');

    if (!state || !(await this.stateStore.consume(state))) {
      throw new Error('oauth.invalid_state');
    }

    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);
    const tokenRes = await fetch(tokenUrl);
    if (!tokenRes.ok) throw new Error('oauth.meta.token_exchange_failed');
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) throw new Error('oauth.meta.access_token_missing');

    // Query debug_token to obtain user id deterministically
    const debugUrl = new URL('https://graph.facebook.com/debug_token');
    debugUrl.searchParams.set('input_token', token.access_token);
    debugUrl.searchParams.set('access_token', `${clientId}|${clientSecret}`);
    const debugRes = await fetch(debugUrl);
    if (!debugRes.ok) throw new Error('oauth.meta.debug_token_failed');
    const debug = (await debugRes.json()) as { data?: { user_id?: string } };
    const uid = debug.data?.user_id;
    if (!uid) throw new Error('oauth.meta.user_id_missing');
    return { provider: 'meta', providerUserId: uid };
  }
}
