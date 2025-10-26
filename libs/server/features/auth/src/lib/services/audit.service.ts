import { Injectable } from '@nestjs/common';

import { LoggerService } from '@cthub-bsaas/server-core';
import { CorrelationId } from '@cthub-bsaas/server-core';

/**
 * @public
 * Lightweight audit logger for security-relevant events.
 */
@Injectable()
export class AuditService {
  private static readonly CONTEXT = 'AuthAudit';
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  /**
   * Write a structured audit entry to the access log channel.
   * @param {string} event Event key (e.g., login_success).
   * @param {Record<string, unknown>} details Contextual data (userId, sessionId, etc.).
   * @returns {void}
   */
  public log(event: string, details: Record<string, unknown>): void {
    const cid = CorrelationId.get?.();
    const full = cid ? { ...details, correlationId: cid } : details;
    const payload = `${event} ${JSON.stringify(full)}`;
    this.logger.access(payload, AuditService.CONTEXT);
  }
}
