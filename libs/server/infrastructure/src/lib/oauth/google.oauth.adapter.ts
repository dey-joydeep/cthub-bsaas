import { Injectable } from '@nestjs/common';
import type { OAuthPort, OAuthStartResult, OAuthProfile } from '@cthub-bsaas/server-contracts-auth';
import { ConfigService } from '@cthub-bsaas/server-core';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import type { OAuthStateStore } from './state.store';

@Injectable()
export class GoogleOAuthAdapter implements OAuthPort {
  private readonly ttlSec: number;
  private readonly client: OAuth2Client;

  constructor(
    private readonly config: ConfigService,
    private readonly stateStore: OAuthStateStore,
  ) {
    this.ttlSec = parseInt(this.config.get<string>('OAUTH_STATE_TTL') ?? '600', 10);
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI') ?? '';
    this.client = new OAuth2Client({ clientId, clientSecret, redirectUri });
  }

  async start(provider: string, _link?: boolean): Promise<OAuthStartResult> {
    if (provider !== 'google') throw new Error('oauth.unsupported_provider');
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    if (!clientId || !redirectUri) throw new Error('oauth.google.misconfigured');
    const nonce = crypto.randomBytes(16).toString('base64url');
    const state = crypto.randomBytes(24).toString('base64url');
    await this.stateStore.set(state, this.ttlSec);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('nonce', nonce);
    return { redirectUrl: url.toString(), state };
  }

  async exchangeCode(provider: string, code: string, state?: string): Promise<OAuthProfile> {
    if (provider !== 'google') throw new Error('oauth.unsupported_provider');
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) throw new Error('oauth.google.misconfigured');

    if (!state || !(await this.stateStore.consume(state))) {
      throw new Error('oauth.invalid_state');
    }

    const { tokens } = await this.client.getToken({ code, redirect_uri: redirectUri });
    if (!tokens.id_token) throw new Error('oauth.google.id_token_missing');

    const ticket = await this.client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const payload = ticket.getPayload();
    const sub = payload?.sub;
    if (!sub) throw new Error('oauth.google.invalid_id_token');
    return { provider: 'google', providerUserId: sub };
  }
}
