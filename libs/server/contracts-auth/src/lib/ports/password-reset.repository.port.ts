/**
 * @public
 * Injection token for {@link IPasswordResetRepository}.
 */
export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');

/**
 * @public
 * DB record for a password reset token.
 */
export interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * @public
 * Repository interface for issuing and validating password reset tokens.
 */
export interface IPasswordResetRepository {
  create(data: { id: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetRecord>;
  findById(id: string): Promise<PasswordResetRecord | null>;
  markUsed(id: string): Promise<void>;
}

