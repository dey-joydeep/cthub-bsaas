import type { RefreshToken } from '@prisma/client';

/**
 * @public
 * Injection token for {@link IRefreshTokenRepository}.
 */
export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

/**
 * @public
 * Repository for issuing and rotating refresh tokens.
 */
export interface IRefreshTokenRepository {
    /**
     * Persist a newly issued refresh token.
     * @param {Omit<RefreshToken, 'issuedAt' | 'revokedAt' | 'rotatedFrom'> & Partial<Pick<RefreshToken, 'revokedAt' | 'rotatedFrom'>>} data - Token metadata.
     * @returns {Promise<RefreshToken>} Persisted token.
     */
    create(
        data: Omit<RefreshToken, 'issuedAt' | 'revokedAt' | 'rotatedFrom'> &
            Partial<Pick<RefreshToken, 'revokedAt' | 'rotatedFrom'>>
    ): Promise<RefreshToken>;
    /**
     * Lookup a refresh token by its JTI.
     * @param {string} jti - Token identifier.
     * @returns {Promise<RefreshToken | null>} Token or null.
     */
    findByJti(jti: string): Promise<RefreshToken | null>;
    /**
     * Revoke a refresh token.
     * @param {string} jti - Token identifier.
     * @returns {Promise<RefreshToken>} Updated (revoked) token.
     */
    revoke(jti: string): Promise<RefreshToken>;
}
