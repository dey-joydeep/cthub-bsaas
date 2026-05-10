import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

/**
 * Passport guard that attempts JWT authentication but gracefully falls back
 * to an anonymous request when credentials are missing or invalid.
 */
@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt') {
  /**
   * Allow downstream route handlers to continue even when authentication fails.
   * Only unexpected errors propagate; auth failures simply result in
   * an undefined user on the request so controllers can personalise optionally.
   */
  override handleRequest<TUser = AuthenticatedUser | undefined>(
    err: Error | null,
    user: TUser | false | null,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    void context;
    void status;
    if (user) {
      return user as TUser;
    }

    if (err) {
      if (!(err instanceof UnauthorizedException)) {
        throw err;
      }
      return undefined as TUser;
    }

    const normalizedInfo = this.normalizeInfo(info);
    if (normalizedInfo instanceof UnauthorizedException) {
      return undefined as TUser;
    }

    if (normalizedInfo instanceof Error) {
      return undefined as TUser;
    }

    return undefined as TUser;
  }

  private normalizeInfo(info: unknown): unknown {
    if (!info) {
      return undefined;
    }

    if (Array.isArray(info)) {
      return info.length > 0 ? this.normalizeInfo(info[0]) : undefined;
    }

    return info;
  }
}
