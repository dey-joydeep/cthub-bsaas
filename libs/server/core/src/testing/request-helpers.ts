export type RawSetCookieHeader = string[] | string | undefined;

export interface CookieHeaderOptions {
  readonly names?: readonly string[];
}

export function toSetCookieArray(raw: RawSetCookieHeader): string[] {
  if (!raw) {
    return [];
  }

  return Array.isArray(raw) ? raw : [raw];
}

export function extractCookieValue(cookies: readonly string[], name: string): string | undefined {
  const prefix = `${name}=`;
  const cookie = cookies.find((value) => value.startsWith(prefix));
  return cookie?.split(';')[0]?.slice(prefix.length);
}

export function buildCookieHeader(cookies: readonly string[], options: CookieHeaderOptions = {}): string {
  const allowedNames = options.names ? new Set(options.names) : undefined;

  return cookies
    .map((cookie) => cookie.split(';')[0])
    .filter((cookie): cookie is string => {
      if (!cookie) {
        return false;
      }

      if (!allowedNames) {
        return true;
      }

      const [name] = cookie.split('=');
      return !!name && allowedNames.has(name);
    })
    .join('; ');
}

export interface HeaderSetter<T> {
  set(name: string, value: string): T;
}

export function withBearerAuth<T extends HeaderSetter<T>>(request: T, accessToken: string): T {
  return request.set('Authorization', `Bearer ${accessToken}`);
}

export function withCookieHeader<T extends HeaderSetter<T>>(request: T, cookies: readonly string[]): T {
  const header = buildCookieHeader(cookies);
  return header ? request.set('Cookie', header) : request;
}
