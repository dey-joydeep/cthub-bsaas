import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OAuthPort, OAuthStartResult, OAuthProfile } from '@cthub-bsaas/server-contracts-auth';
import crypto from 'crypto';

/**
 * OAuthAdapter: development adapter with deterministic behavior suitable for tests
 * and local environments. Builds provider URLs from config with a sane default
 * and encodes lightweight state including a nonce and optional link intent.
 */
@Injectable()
export class OAuthAdapter implements OAuthPort {
  constructor(private readonly config: ConfigService) {}

  async start(provider: string, link?: boolean): Promise<OAuthStartResult> {
    const base = this.config.get<string>('OAUTH_AUTHORIZE_BASE', 'https://example.com/oauth');
    const nonce = crypto.randomBytes(8).toString('base64url');
    const payload = { link: !!link, n: nonce, t: Date.now() };
    const state = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return { redirectUrl: `${base}/${provider}/authorize?state=${state}`, state };
  }

  async exchangeCode(provider: string, code: string, state?: string): Promise<OAuthProfile> {
    // Parse state if present (best-effort; ignore errors for dev adapter)
    if (state) {
      try {
        JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as unknown;
      } catch {
        // ignore malformed state in dev adapter
      }
    }
    // Deterministic id from code for testability
    const providerUserId = `dev_${crypto.createHash('sha256').update(code).digest('hex').slice(0, 12)}`;
    return { provider, providerUserId };
  }
}
