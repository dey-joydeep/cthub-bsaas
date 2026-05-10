/**
 * @public
 * Injection token for {@link RecoveryCodesPort}.
 */
export const RECOVERY_CODES_PORT = Symbol('RECOVERY_CODES_PORT');

/**
 * @public
 * Abstraction for generating and verifying single-use recovery codes.
 */
export interface RecoveryCodesPort {
  /**
   * Generate fresh recovery codes for a user, replacing any existing set.
   * @param {string} userId - User id.
   * @param {number} count - Number of codes to generate.
   * @returns {Promise<string[]>} The plain-text recovery codes (hashes stored by impl).
   */
  generate(userId: string, count?: number): Promise<string[]>;

  /**
   * Verify a code and consume it if valid.
   * @param {string} userId - User id.
   * @param {string} code - Recovery code provided by user.
   * @returns {Promise<boolean>} True if valid and consumed.
   */
  verifyAndConsume(userId: string, code: string): Promise<boolean>;
}

