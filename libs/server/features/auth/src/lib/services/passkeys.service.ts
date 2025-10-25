import { Inject, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import {
  CREDENTIAL_PASSKEY_REPOSITORY,
  ICredentialPasskeyRepository,
  PasskeyRecord,
  SOCIAL_ACCOUNT_REPOSITORY,
  ISocialAccountRepository,
  USER_REPOSITORY,
  IUserRepository,
} from '@cthub-bsaas/server-contracts-auth';
import { AuditService } from './audit.service';
import { COMMON_ERROR_CODES } from '@cthub-bsaas/shared';

@Injectable()
export class PasskeysService {
  constructor(
    @Inject(CREDENTIAL_PASSKEY_REPOSITORY) private readonly passkeys: ICredentialPasskeyRepository,
    @Inject(SOCIAL_ACCOUNT_REPOSITORY) private readonly socials: ISocialAccountRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string): Promise<PasskeyRecord[]> {
    const list = await this.passkeys.listByUser(userId);
    this.audit?.log('webauthn_passkey_list', { userId, count: list.length });
    return list;
  }

  async delete(userId: string, credentialId: string): Promise<{ success: true }> {
    if (!credentialId || credentialId.length === 0) {
      throw new BadRequestException(COMMON_ERROR_CODES.VALIDATION);
    }
    const [count, user, social] = await Promise.all([
      this.passkeys.countByUser(userId),
      this.users.findById(userId),
      this.socials.findByUserId(userId),
    ]);
    const hasPassword = !!user?.passwordHash && user.passwordHash.length > 0;
    // block deleting the last method (no password, no socials, and only one passkey)
    if (count <= 1 && !hasPassword && social.length === 0) {
      this.audit?.log('webauthn_passkey_delete_blocked_last_method', { userId, credentialId });
      throw new UnauthorizedException('error.auth.cannot_delete_last_method');
    }
    const ok = await this.passkeys.deleteForUser(userId, credentialId);
    if (!ok) {
      this.audit?.log('webauthn_passkey_delete_not_found', { userId, credentialId });
      throw new UnauthorizedException('error.auth.not_found');
    }
    this.audit?.log('webauthn_passkey_delete', { userId, credentialId });
    return { success: true } as const;
  }
}
