import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CREDENTIAL_TOTP_REPOSITORY, ICredentialTotpRepository, CREDENTIAL_PASSKEY_REPOSITORY, ICredentialPasskeyRepository } from '@cthub-bsaas/server-contracts-auth';
import { Inject } from '@nestjs/common';
import { AUTH_ERROR_CODES } from '@cthub-bsaas/shared';

/**
 * StrongAuthGuard enforces strong authentication (Passkey or verified TOTP)
 * for specific roles (Admin). It assumes {@link JwtAuthGuard} has already
 * populated `req.user` with `{ userId: string, roles: string[] }`.
 *
 * Current implementation checks for verified TOTP. Passkey presence may be
 * added via a repository/port in a follow-up.
 */
@Injectable()
export class StrongAuthGuard implements CanActivate {
  constructor(
    @Inject(CREDENTIAL_TOTP_REPOSITORY) private readonly totpRepo: ICredentialTotpRepository,
    @Inject(CREDENTIAL_PASSKEY_REPOSITORY) private readonly passkeyRepo: ICredentialPasskeyRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = (req as { user?: { userId: string; roles?: string[] } }).user;
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    // Enforce for Admin role only; Owners/Staff optional unless tenant policy adds enforcement.
    const isAdmin = roles.some((r) => String(r).toUpperCase() === 'ADMIN');
    if (!isAdmin) return true;

    // Check verified TOTP
    const totp = await this.totpRepo.findByUserId(user.userId);
    const hasTotp = !!totp?.verified;
    const hasPasskey = await this.passkeyRepo.hasAny(user.userId);
    if (hasTotp || hasPasskey) return true;

    throw new ForbiddenException(AUTH_ERROR_CODES.STRONG_AUTH_REQUIRED);
  }
}
