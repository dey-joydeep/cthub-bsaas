import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * @public
 * Metadata key to bypass CSRF checks for specific route handlers.
 */
export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * @public
 * Decorator to bypass CSRF validation on a handler (e.g., login, refresh).
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

/**
 * @public
 * Double-submit CSRF guard: for unsafe methods, require matching header and cookie tokens.
 * - Safe methods (GET, HEAD, OPTIONS) are allowed.
 * - Routes decorated with {@link SkipCsrf} are allowed.
 * - Otherwise, the header must equal cookie `XSRF-TOKEN`.
 *   Accepts standard Angular header `X-XSRF-TOKEN` (case-insensitive) and
 *   also `X-CSRF-Token` for compatibility.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req = context
      .switchToHttp()
      .getRequest<{ method: string; headers: Record<string, string | string[] | undefined>; cookies?: Record<string, string> }>();
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

    const header =
      (req.headers['x-xsrf-token'] as string | undefined) ||
      (req.headers['x-csrf-token'] as string | undefined) ||
      ((req.headers['X-CSRF-Token'] as unknown) as string | undefined);
    const cookie = req.cookies?.['XSRF-TOKEN'];
    // Enforce double-submit only when server has issued a CSRF cookie
    if (cookie) {
      if (!header || header !== cookie) {
        throw new ForbiddenException('error.security.csrf_failed');
      }
    }
    return true;
  }
}
