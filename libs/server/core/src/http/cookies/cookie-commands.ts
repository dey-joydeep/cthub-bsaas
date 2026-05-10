import { Injectable, Scope } from '@nestjs/common';

export type SameSiteOption = 'lax' | 'strict' | 'none';

/** A vendor-agnostic subset of cookie options */
export interface CookieOptions {
  readonly httpOnly?: boolean;
  readonly secure?: boolean;
  readonly sameSite?: SameSiteOption;
  readonly path?: string;
  readonly domain?: string;
  readonly maxAge?: number; // seconds
  readonly expires?: Date;
}

export type CookieCommand =
  | { action: 'set'; name: string; value: string; options?: CookieOptions }
  | { action: 'clear'; name: string; options?: CookieOptions };

/**
 * @public
 * Request-scoped registry for cookie set/clear commands to be applied
 * by an interceptor after the controller returns a body.
 */
@Injectable({ scope: Scope.REQUEST })
export class CookieRegistry {
  private readonly commands: CookieCommand[] = [];

  add(cmd: CookieCommand): void {
    this.commands.push(cmd);
  }

  set(name: string, value: string, options?: CookieOptions): void {
    this.add({ action: 'set', name, value, options });
  }

  clear(name: string, options?: CookieOptions): void {
    this.add({ action: 'clear', name, options });
  }

  /** Drain queued commands and reset internal state */
  drain(): CookieCommand[] {
    const out = this.commands.slice();
    this.commands.length = 0;
    return out;
  }
}

/** Build a single Set-Cookie header string for both Express and Fastify */
export function buildSetCookie(cmd: CookieCommand): string {
  const opts = cmd.action === 'set' ? cmd.options ?? {} : cmd.options ?? {};
  const name = cmd.name;
  const value = cmd.action === 'set' ? encodeURIComponent(cmd.value) : '';
  const parts: string[] = [`${name}=${value}`];

  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);

  // Clearing: force an expires in the past if not provided
  if (cmd.action === 'clear') {
    const exp = opts.expires ?? new Date('Thu, 01 Jan 1970 00:00:00 GMT');
    parts.push(`Expires=${exp.toUTCString()}`);
    // optionally set Max-Age=0 for good measure
    parts.push('Max-Age=0');
  } else if (opts.expires) {
    parts.push(`Expires=${opts.expires.toUTCString()}`);
  }
  if (typeof opts.maxAge === 'number') {
    parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  }
  if (opts.secure) parts.push('Secure');
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.sameSite) {
    const s = opts.sameSite;
    // Capitalize per spec
    const v = s === 'lax' ? 'Lax' : s === 'strict' ? 'Strict' : 'None';
    parts.push(`SameSite=${v}`);
  }

  return parts.join('; ');
}

