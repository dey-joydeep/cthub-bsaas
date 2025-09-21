const configureMock = jest.fn();
const getLoggerMock = jest.fn();
const mkdirSyncMock = jest.fn();

jest.mock('log4js', () => ({
  configure: configureMock,
  getLogger: getLoggerMock,
}));

jest.mock('node:fs', () => ({
  mkdirSync: mkdirSyncMock,
}));

import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  const configService = {
    log: {
      dir: 'logs',
      app: { file: 'app.log', level: 'debug' },
      access: { file: 'access.log', level: 'info' },
    },
  } as const;

  let defaultLogger: Record<string, jest.Mock>;
  let accessLogger: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();

    defaultLogger = {
      level: jest.fn(),
      isLevelEnabled: jest.fn(),
      log: jest.fn(),
      addContext: jest.fn(),
      removeContext: jest.fn(),
      setParseCallStackFunction: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      mark: jest.fn(),
    };

    accessLogger = {
      ...defaultLogger,
      info: jest.fn(),
    };

    getLoggerMock.mockImplementation((category?: string) => (category === 'access' ? accessLogger : defaultLogger));
  });

  it('configures log4js using config service settings', () => {
    const service = new LoggerService(configService as any);

    service.onModuleInit();

    expect(mkdirSyncMock).toHaveBeenCalledWith('logs', { recursive: true });
    expect(configureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appenders: expect.objectContaining({
          app: expect.objectContaining({ filename: expect.stringContaining('app.log') }),
          access: expect.objectContaining({ filename: expect.stringContaining('access.log') }),
        }),
        categories: {
          default: { appenders: ['console', 'app'], level: 'debug' },
          access: { appenders: ['console', 'access'], level: 'info' },
        },
      }),
    );

    expect(getLoggerMock).toHaveBeenCalledWith('access');
    expect(getLoggerMock).toHaveBeenCalledWith();
  });

  it('provides helpers for each log level and channel', () => {
    const service = new LoggerService(configService as any);
    service.onModuleInit();

    service.info('hello', 'Context');
    expect(defaultLogger.info).toHaveBeenCalledWith('[Context] hello');

    service.info('hello no context');
    expect(defaultLogger.info).toHaveBeenCalledWith('hello no context');

    service.warn('watch out', 'Context');
    expect(defaultLogger.warn).toHaveBeenCalledWith('[Context] watch out');

    service.error('fail', 'trace', 'Context');
    expect(defaultLogger.error).toHaveBeenCalledWith('[Context] fail', 'trace');

    service.error('fail no trace', undefined, 'Context');
    expect(defaultLogger.error).toHaveBeenCalledWith('[Context] fail no trace');

    service.access('login', 'Security');
    expect(accessLogger.info).toHaveBeenCalledWith('[Security] login');
  });
});
