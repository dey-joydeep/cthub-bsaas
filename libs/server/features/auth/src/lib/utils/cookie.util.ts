/**
 * Parse refresh token cookie from a Cookie header.
 * Supports both 'bsaas_rt' and 'refreshToken' keys.
 * @param cookieHeader Raw Cookie header value
 * @returns Decoded refresh token string when present
 */
export function parseRefreshCookie(cookieHeader?: string): string | undefined {
  if (typeof cookieHeader !== 'string') return undefined;
  for (const part of cookieHeader.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === 'bsaas_rt' || k === 'refreshToken') {
      return decodeURIComponent(v ?? '');
    }
  }
  return undefined;
}
