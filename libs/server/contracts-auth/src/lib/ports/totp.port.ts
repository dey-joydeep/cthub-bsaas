/**
 * @public
 * Injection token for the TOTP port.
 */
export const TOTP_PORT = Symbol('TOTP_PORT');

/**
 * @public
 * Abstraction for TOTP enrollment and verification.
 */
export interface TotpPort {
  /**
   * Create and persist a new TOTP secret for a user and return enrollment data.
   *
   * @param {string} userId - Id of the user enrolling in TOTP.
   * @returns {Promise<{ qrCodeDataUrl: string; secret: string }>} QR code and raw secret.
   */
  generateSecret(userId: string): Promise<{ qrCodeDataUrl: string; secret: string }>;

  /**
   * Verify a token for a user and mark the credential verified when valid.
   *
   * @param {string} userId - Id of the verifying user.
   * @param {string} token - 6-digit TOTP code.
   * @returns {Promise<boolean>} True when valid; false otherwise.
   */
  verifyToken(userId: string, token: string): Promise<boolean>;
}
