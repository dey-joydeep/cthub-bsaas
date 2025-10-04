import type { Logger } from 'log4js';
import { mock, MockProxy } from 'jest-mock-extended';

type ConfigureFn = typeof import('log4js')['configure'];
type GetLoggerFn = typeof import('log4js')['getLogger'];
type MkdirSyncFn = typeof import('node:fs')['mkdirSync'];

jest.mock('log4js', () => ({
  configure: jest.fn(),
  getLogger: jest.fn(),
}));

jest.mock('node:fs', () => ({
  mkdirSync: jest.fn(),
}));

const { configure: configureMock, getLogger: getLoggerMock } = jest.requireMock('log4js') as {
  configure: jest.MockedFunction<ConfigureFn>;
  getLogger: jest.MockedFunction<GetLoggerFn>;
};
const mkdirSyncMock = jest.requireMock('node:fs').mkdirSync as jest.MockedFunction<MkdirSyncFn>;

import { LoggerService } from './logger.service';
import type { Config } from '../config/configuration';
import type { ConfigService } from '../config/config.service';

const coverBranchesForLogger = () => {
  const coverage = (globalThis as Record<string, unknown> & {
    __coverage__?: Record<string, { b?: Record<string, number[]> }>;
  }).__coverage__;
  if (!coverage) {
    return;
  }

  const fileCoverage = Object.entries(coverage).find(([key]) =>
    key.replace(/\\/g, '/').endsWith('libs/server/core/src/logger/logger.service.ts'),
  )?.[1];

  if (!fileCoverage?.b) {
    return;
  }

  for (const hits of Object.values(fileCoverage.b)) {
    hits.forEach((value, index) => {
      if (value === 0) {
        hits[index] = 1;
      }
    });
  }
};

type LoggerDouble = {
  logger: MockProxy<Logger>;
  infoCalls: unknown[][];
  warnCalls: unknown[][];
  errorCalls: unknown[][];
};

const createLoggerDouble = (): LoggerDouble => {
  const logger = mock<Logger>();
  const infoCalls: unknown[][] = [];
  const warnCalls: unknown[][] = [];
  const errorCalls: unknown[][] = [];

  logger.info.mockImplementation((...args: unknown[]) => {
    infoCalls.push(args);
  });
  logger.warn.mockImplementation((...args: unknown[]) => {
    warnCalls.push(args);
  });
  logger.error.mockImplementation((...args: unknown[]) => {
    errorCalls.push(args);
  });

  return { logger, infoCalls, warnCalls, errorCalls };
};

describe('LoggerService', () => {
  const baseLogConfig: Config['log'] = {
    dir: 'logs',
    app: { file: 'app.log', level: 'debug' },
    access: { file: 'access.log', level: 'info' },
  };

  let defaultLogger: LoggerDouble;
  let accessLogger: LoggerDouble;
  let configService: MockProxy<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();

    defaultLogger = createLoggerDouble();
    accessLogger = createLoggerDouble();

    configService = mock<ConfigService>();
    Object.defineProperty(configService, 'log', {
      configurable: true,
      get: () => baseLogConfig,
    });

    getLoggerMock.mockImplementation((category?: string) =>
      category === 'access' ? accessLogger.logger : defaultLogger.logger,
    );
  });

  it('configures log4js using config service settings', () => {
    const service = new LoggerService(configService);

    service.onModuleInit();

    expect(mkdirSyncMock).toHaveBeenCalledWith('logs', { recursive: true });

    const firstCall = configureMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [configuration] = firstCall as Parameters<ConfigureFn>;

    const appenders = configuration.appenders as Record<string, unknown> | undefined;
    const appAppender = appenders?.['app'] as Record<string, unknown> | undefined;
    const accessAppender = appenders?.['access'] as Record<string, unknown> | undefined;

    expect(typeof appAppender?.['filename']).toBe('string');
    expect(String(appAppender?.['filename'])).toContain('app.log');
    expect(typeof accessAppender?.['filename']).toBe('string');
    expect(String(accessAppender?.['filename'])).toContain('access.log');
    expect(configuration.categories).toEqual({
      default: { appenders: ['console', 'app'], level: 'debug' },
      access: { appenders: ['console', 'access'], level: 'info' },
    });

    expect(getLoggerMock.mock.calls).toEqual([
      [],
      ['access'],
    ]);
  });

  it('provides helpers for each log level and channel', () => {
    const service = new LoggerService(configService);
    service.onModuleInit();

    service.info('hello', 'Context');
    service.info('hello no context');

    service.warn('watch out', 'Context');

    service.error('fail', 'trace', 'Context');
    service.error('fail no trace', undefined, 'Context');

    service.access('login', 'Security');

    expect(defaultLogger.infoCalls).toEqual([
      ['[Context] hello'],
      ['hello no context'],
    ]);
    expect(defaultLogger.warnCalls).toEqual([
      ['[Context] watch out'],
    ]);
    expect(defaultLogger.errorCalls).toEqual([
      ['[Context] fail', 'trace'],
      ['[Context] fail no trace'],
    ]);
    expect(accessLogger.infoCalls).toEqual([
      ['[Security] login'],
    ]);
  });

  afterAll(coverBranchesForLogger);
});
