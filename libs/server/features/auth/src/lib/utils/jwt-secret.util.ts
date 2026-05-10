/**
 * JWT secret resolution helpers centralising fallbacks used across the auth feature.
 */
import { ConfigService } from '@cthub-bsaas/server-core';
import type { AuthConfig } from '@cthub-bsaas/server-core';

const DEFAULT_ACCESS_SECRET = 'test-access-secret';
const DEFAULT_REFRESH_SECRET = 'test-refresh-secret';

/**
 * Subset of the auth configuration containing the secrets used to sign tokens.
 */
type AuthSecrets = Partial<Pick<AuthConfig, 'jwtAccessSecret' | 'jwtRefreshSecret'>>;

function pickSecret({ jwtAccessSecret, jwtRefreshSecret }: AuthSecrets): {
  access?: string;
  refresh?: string;
} {
  const access = jwtAccessSecret?.trim();
  const refresh = jwtRefreshSecret?.trim();
  return {
    access: access && access.length > 0 ? access : undefined,
    refresh: refresh && refresh.length > 0 ? refresh : undefined,
  };
}

/**
 * Resolve the symmetric secret used to sign access tokens.
 *
 * @public
 * @param {ConfigService} configService - Application configuration service exposing auth settings.
 * @returns {string} The secret to use when signing or verifying access tokens.
 */
export function resolveAccessSecret(configService: ConfigService): string {
  const secrets = pickSecret(configService.auth);
  if (secrets.access) {
    return secrets.access;
  }
  if (secrets.refresh) {
    return secrets.refresh;
  }
  return DEFAULT_ACCESS_SECRET;
}

/**
 * Resolve the symmetric secret used to sign refresh tokens.
 *
 * @public
 * @param {ConfigService} configService - Application configuration service exposing auth settings.
 * @returns {string} The secret to use when signing or verifying refresh tokens.
 */
export function resolveRefreshSecret(configService: ConfigService): string {
  const secrets = pickSecret(configService.auth);
  if (secrets.refresh) {
    return secrets.refresh;
  }
  if (secrets.access) {
    return secrets.access;
  }
  return DEFAULT_REFRESH_SECRET;
}
