import { Injectable } from '@nestjs/common';
import { EmailPort } from '@cthub-bsaas/server-contracts-auth';

/**
 * @public
 * Console-based email adapter used for local/dev environments.
 * Writes a truncated message preview to stdout instead of sending.
 */
@Injectable()
export class ConsoleEmailAdapter implements EmailPort {
  /**
   * Write a preview of the outgoing email to stdout.
   *
   * @param {string} to - Recipient email address.
   * @param {string} subject - Message subject line.
   * @param {string} body - Message body (plain text or HTML).
   * @returns {Promise<void>} Resolves immediately after logging.
   */
  public sendMail(to: string, subject: string, body: string): Promise<void> {
    // In real impl, integrate with an email provider.
    // For now, log to console for visibility in dev/test.
    console.log(`[Email] To: ${to} | Subject: ${subject} | Body: ${body.substring(0, 120)}...`);
    return Promise.resolve();
  }
}
