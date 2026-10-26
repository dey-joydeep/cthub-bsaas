import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';

import { ConfigService } from '../config/config.service';
import { CorrelationId } from '../http/correlation-id.middleware';

/**
 * @public
 * Centralized logger facade that configures Pino structured logging once and exposes
 * helper methods for application and access logs.
 */
@Injectable()
export class LoggerService implements OnModuleInit {
  private accessLogger!: PinoLogger;
  private appLogger!: PinoLogger;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * @public
   * @returns {void} Sets up Pino transports and appenders based on application configuration.
   */
  onModuleInit(): void {
    const { dir, access, app } = this.configService.log;
    this.ensureLogDirectory(dir);

    const isTest = process.env['NODE_ENV'] === 'test';

    this.appLogger = pino({
      level: app.level,
      transport: isTest
        ? undefined
        : {
            targets: [
              {
                target: 'pino/file',
                options: { destination: 1 },
                level: app.level,
              },
              {
                target: 'pino-roll',
                options: {
                  file: join(dir, app.file),
                  frequency: 'daily',
                  mkdir: true,
                  size: '200m',
                },
                level: app.level,
              },
            ],
          },
    });

    this.accessLogger = pino({
      level: access.level,
      transport: isTest
        ? undefined
        : {
            targets: [
              {
                target: 'pino/file',
                options: { destination: 1 },
                level: access.level,
              },
              {
                target: 'pino-roll',
                options: {
                  file: join(dir, access.file),
                  frequency: 'daily',
                  mkdir: true,
                  size: '200m',
                },
                level: access.level,
              },
            ],
          },
    });
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
    const formatted = this.formatMessage(message, context);
    if (trace) {
      this.appLogger.error({ trace }, formatted);
      return;
    }
    this.appLogger.error(formatted);
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
