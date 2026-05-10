/**
 * @public
 * Token used to inject an implementation of {@link EmailPort}.
 */
export const EMAIL_PORT = Symbol('EMAIL_PORT');

/**
 * @public
 * Abstraction for sending emails. Implementations may deliver via any provider.
 */
export interface EmailPort {
  /**
   * Send an email message.
   *
   * @param {string} to - Recipient email address.
   * @param {string} subject - Message subject line.
   * @param {string} body - Message body (plain text or pre-rendered HTML).
   * @returns {Promise<void>} Resolves when the provider accepts the message.
   */
  sendMail(to: string, subject: string, body: string): Promise<void>;
}
