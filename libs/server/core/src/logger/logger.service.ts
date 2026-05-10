import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { configure, getLogger, Logger } from 'log4js';

import { ConfigService } from '../config/config.service';
import { CorrelationId } from '../http/correlation-id.middleware';

/**
 * @public
 * Centralized logger facade that configures log4js once and exposes
 * structured logging helpers for the application and access logs.
 */
@Injectable()
export class LoggerService implements OnModuleInit {
  private accessLogger!: Logger;
  private appLogger!: Logger;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * @public
   * @returns {void} Sets up log4js appenders based on application configuration.
   */
  onModuleInit(): void {
    const { dir, access, app } = this.configService.log;

    this.ensureLogDirectory(dir);

    configure({
      appenders: {
        console: { type: 'console' },
        access: {
          type: 'dateFile',
          filename: join(dir, access.file),
          pattern: '-yyyy-MM-dd',
          maxLogSize: 209_715_200,
          backups: 3,
          compress: true,
        },
        app: {
          type: 'dateFile',
          filename: join(dir, app.file),
          pattern: '-yyyy-MM-dd',
          maxLogSize: 209_715_200,
          backups: 3,
          compress: true,
        },
      },
      categories: {
        default: { appenders: ['console', 'app'], level: app.level },
        access: { appenders: ['console', 'access'], level: access.level },
      },
    });

    this.appLogger = getLogger();
    this.accessLogger = getLogger('access');
  }

  /**
   * @public
   * @param {string} message Log payload.
   * @param {string} [context] Logical scope of the message (e.g. service name).
   * @returns {void}
   */
  info(message: string, context?: string): void {
    this.appLogger.info(this.formatMessage(message, context));
  }

  /**
   * @public
   * @param {string} message Log payload.
   * @param {string} [context] Logical scope of the message (e.g. service name).
   * @returns {void}
   */
  warn(message: string, context?: string): void {
    this.appLogger.warn(this.formatMessage(message, context));
  }

  /**
   * @public
   * @param {string} message Log payload.
   * @param {string} [trace] Optional stack trace captured upstream.
   * @param {string} [context] Logical scope of the message (e.g. service name).
   * @returns {void}
   */
  error(message: string, trace?: string, context?: string): void {
    const formattedMessage = this.formatMessage(message, context);

    if (trace) {
      this.appLogger.error(formattedMessage, trace);
      return;
    }

    this.appLogger.error(formattedMessage);
  }

  /**
   * @public
   * @param {string} message Log payload.
   * @param {string} [context] Logical scope of the message (e.g. caller).
   * @returns {void}
   */
  access(message: string, context?: string): void {
    this.accessLogger.info(this.formatMessage(message, context));
  }

  /**
   * @private
   * @param {string} dir Directory that must exist prior to logging.
   * @returns {void}
   */
  private ensureLogDirectory(dir: string): void {
    mkdirSync(dir, { recursive: true });
  }

  /**
   * @private
   * @param {string} message Log payload.
   * @param {string} [context] Logical scope of the message (e.g. service name).
   * @returns {string} A formatted log string that embeds the optional context.
   */
  private formatMessage(message: string, context?: string): string {
    const cid = CorrelationId.get();
    const parts: string[] = [];
    if (cid) parts.push(`[cid=${cid}]`);
    if (context) parts.push(`[${context}]`);
    parts.push(message);
    return parts.join(' ');
  }
}
