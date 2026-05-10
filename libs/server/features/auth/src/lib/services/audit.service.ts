import { Injectable, Logger } from '@nestjs/common';

/**
 * @public
 * Lightweight audit logger for security-relevant events.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  /**
   * Write a structured audit entry.
   * @param {string} event - Event key (e.g., login_success).
   * @param {Record<string, unknown>} details - Contextual data (userId, sessionId, etc.).
   * @returns {void}
   */
  public log(event: string, details: Record<string, unknown>): void {
    this.logger.log(`${event} ${JSON.stringify(details)}`);
  }
}

