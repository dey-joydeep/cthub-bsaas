import type { CredentialTOTP } from '@prisma/client';

/**
 * @public
 * Injection token for {@link ICredentialTotpRepository}.
 */
export const CREDENTIAL_TOTP_REPOSITORY = 'CREDENTIAL_TOTP_REPOSITORY';

/**
 * @public
 * Repository for managing the TOTP credential secret and verification status.
 */
export interface ICredentialTotpRepository {
    /**
     * Find the TOTP credential by user id.
     * @param {string} userId - Owner user id.
     * @returns {Promise<CredentialTOTP | null>} Credential or null.
     */
    findByUserId(userId: string): Promise<CredentialTOTP | null>;
    /**
     * Create a TOTP credential for a user.
     * @param {{ userId: string; secretEncrypted: Buffer }} data - Creation payload.
     * @returns {Promise<CredentialTOTP>} Persisted credential.
     */
    create(data: { userId: string; secretEncrypted: Buffer }): Promise<CredentialTOTP>;
    /**
     * Update the credential's secret and/or verification flag.
     * @param {string} userId - Owner user id.
     * @param {{ secretEncrypted?: Buffer; verified?: boolean }} data - Fields to update.
     * @returns {Promise<CredentialTOTP>} Updated credential.
     */
    update(
        userId: string,
        data: { secretEncrypted?: Buffer; verified?: boolean }
    ): Promise<CredentialTOTP>;
}
