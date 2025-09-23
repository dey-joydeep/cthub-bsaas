import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Inject } from '@nestjs/common';
import {
  CREDENTIAL_TOTP_REPOSITORY,
  ICredentialTotpRepository,
  CREDENTIAL_PASSKEY_REPOSITORY,
  ICredentialPasskeyRepository,
} from '@cthub-bsaas/server-contracts-auth';
import { AUTH_ERROR_CODES } from '@cthub-bsaas/shared';
import type { AuthenticatedUser, UserRole, UserRoleInfo } from '@cthub-bsaas/shared';

/**
 * StrongAuthGuard enforces strong authentication (Passkey or verified TOTP) for Admin users.
 * Assumes JwtAuthGuard already populated req.user.
 *
 * Behavior expected by the spec:
 * - Unauthenticated user => resolves false (let JwtAuthGuard/route config handle 401 elsewhere).
 * - Non-admin users => resolves true (no strong auth requirement).
 * - Admin users => resolves true if:
 *     - TOTP record exists and `verified === true`, OR
 *     - a passkey exists for the user (hasAny === true).
 *   Otherwise throws ForbiddenException(STRONG_AUTH_REQUIRED).
 */

type MaybeRole = UserRole | UserRoleInfo | string;

function normalizeRoles(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return (input as MaybeRole[])
    .map((r) => {
      if (typeof r === 'string') return r;
      if (r && typeof r.name === 'string') return r.name;
      return undefined;
    })
    .filter((v): v is string => !!v)
    .map((v) => v.toUpperCase());
}

function pickUserId(user: unknown): string | null {
  if (user && typeof user === 'object') {
    const u = user as { userId?: unknown; id?: unknown };
    if (typeof u.userId === 'string') return u.userId;
    if (typeof u.id === 'string') return u.id;
  }
  return null;
}

@Injectable()
export class StrongAuthGuard implements CanActivate {
  constructor(
    @Inject(CREDENTIAL_TOTP_REPOSITORY) private readonly totpRepo: ICredentialTotpRepository,
    @Inject(CREDENTIAL_PASSKEY_REPOSITORY) private readonly passkeyRepo: ICredentialPasskeyRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: Partial<AuthenticatedUser> & { userId?: string } }>();

    const user = req.user;
    // Spec requires: unauthenticated => return false (no throw here)
    if (!user) return false;

    const roles = normalizeRoles(user.roles);
    const isAdmin = roles.includes('ADMIN');
    if (!isAdmin) return true;

    const userId = pickUserId(user);
    if (!userId) {
      // Admin with no resolvable id cannot satisfy strong auth checks
      throw new ForbiddenException(AUTH_ERROR_CODES.STRONG_AUTH_REQUIRED);
    }

    // Allow if TOTP is verified
    const totp = await this.totpRepo.findByUserId(userId);
    const hasVerifiedTotp =
      !!totp && Object.prototype.hasOwnProperty.call(totp, 'verified') && (totp as { verified?: unknown }).verified === true;

    // Or if any passkey exists
    const hasPasskey = await this.passkeyRepo.hasAny(userId);

    if (hasVerifiedTotp || hasPasskey) return true;

    throw new ForbiddenException(AUTH_ERROR_CODES.STRONG_AUTH_REQUIRED);
  }
}
