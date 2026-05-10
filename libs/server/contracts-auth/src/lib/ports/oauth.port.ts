/**
 * @public
 * OAuth provider abstraction used by auth feature.
 */
export const OAUTH_PORT = 'OAUTH_PORT';

export interface OAuthStartResult {
  redirectUrl: string;
  state?: string;
}

export interface OAuthProfile {
  provider: string;
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
}

export interface OAuthPort {
  /** Begin the OAuth flow by returning a provider authorization URL. */
  start(provider: string, link?: boolean): Promise<OAuthStartResult>;
  /** Exchange an authorization code for a profile. */
  exchangeCode(provider: string, code: string, state?: string): Promise<OAuthProfile>;
}

