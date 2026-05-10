import { Logger } from '@nestjs/common';
import { Prisma, PrismaClient, PrismaPromise } from '@prisma/client';
import type { AppConfig, ConfigService } from '@cthub-bsaas/server-core';
import { PrismaService } from './prisma.service';

const baseAppConfig: AppConfig = {
  port: 3000,
  nodeEnv: 'test',
  isProduction: false,
  isDevelopment: false,
  isTest: true,
  bodyLimitJson: '10mb',
  bodyLimitUrlEncoded: '10mb',
};

const createConfigService = (overrides?: Partial<AppConfig>): ConfigService => {
  return {
    app: {
      ...baseAppConfig,
      ...overrides,
    },
  } as unknown as ConfigService;
};

const createService = (appOverrides?: Partial<AppConfig>) => new PrismaService(createConfigService(appOverrides));

type PrismaEventName = 'query' | 'error';

const mockLogger = () => {
  const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  const debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  const fatalSpy = jest.spyOn(Logger.prototype, 'fatal').mockImplementation(() => undefined);
  return { logSpy, debugSpy, errorSpy, fatalSpy } as const;
};

describe('PrismaService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers query logging in development mode and logs query details', () => {
    const handlers = new Map<PrismaEventName, (payload: unknown) => void>();
    const onSpy = jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (
      this: PrismaClient,
      event: unknown,
      callback: unknown,
    ) {
      if (event === 'query' || event === 'error') {
        handlers.set(event, callback as (payload: unknown) => void);
      }
      return this;
    });
    const { debugSpy, errorSpy } = mockLogger();

    createService({ isDevelopment: true });

    expect(onSpy).toHaveBeenCalledWith('query', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));

    const queryEvent: Prisma.QueryEvent = {
      query: 'SELECT 1',
      params: '[]',
      duration: 3,
      target: 'database',
      timestamp: new Date(),
    };
    handlers.get('query')?.(queryEvent);
    expect(debugSpy).toHaveBeenCalledWith(`Query: ${queryEvent.query}`);
    expect(debugSpy).toHaveBeenCalledWith(`Params: ${queryEvent.params}`);
    expect(debugSpy).toHaveBeenCalledWith(`Duration: ${queryEvent.duration}ms`);

    const errorEvent: Prisma.LogEvent = {
      message: 'Failure',
      target: 'QueryEngine',
      timestamp: new Date(),
    };
    handlers.get('error')?.(errorEvent);
    expect(errorSpy).toHaveBeenCalledWith(`Prisma Error: ${errorEvent.message}\n${errorEvent.target}`, errorEvent);
  });

  it('does not register query logging when not in development mode', () => {
    const handlers = new Map<PrismaEventName, (payload: unknown) => void>();
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (
      this: PrismaClient,
      event: unknown,
      callback: unknown,
    ) {
      if (event === 'query' || event === 'error') {
        handlers.set(event, callback as (payload: unknown) => void);
      }
      return this;
    });
    mockLogger();

    createService({ isDevelopment: false });

    expect(handlers.has('query')).toBe(false);
    expect(handlers.has('error')).toBe(true);
  });

  it('defaults to non-development when no ConfigService is provided', () => {
    const handlers = new Map<PrismaEventName, (payload: unknown) => void>();
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (
      this: PrismaClient,
      event: unknown,
      callback: unknown,
    ) {
      if (event === 'query' || event === 'error') {
        handlers.set(event, callback as (payload: unknown) => void);
      }
      return this;
    });
    mockLogger();

    // Construct without a ConfigService to exercise the nullish coalesce branch
    // isDevelopment resolves to false via `?? false`
    new PrismaService();

    expect(handlers.has('query')).toBe(false);
    expect(handlers.has('error')).toBe(true);
  });

  it('connects to the database on init and logs the outcome', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const connectSpy = jest.spyOn(PrismaClient.prototype, '$connect').mockResolvedValue();
    const { logSpy } = mockLogger();

    const service = createService();
    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('Successfully connected to the database');
  });

  it('logs and rethrows errors when database connection fails on init', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const connectionError = new Error('connection failed');
    jest.spyOn(PrismaClient.prototype, '$connect').mockRejectedValue(connectionError);
    const { errorSpy } = mockLogger();

    const service = createService();

    await expect(service.onModuleInit()).rejects.toThrow(connectionError);
    expect(errorSpy).toHaveBeenCalledWith('Failed to connect to the database', connectionError);
  });

  it('disconnects from the database on destroy and logs the outcome', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const disconnectSpy = jest.spyOn(PrismaClient.prototype, '$disconnect').mockResolvedValue();
    const { logSpy } = mockLogger();

    const service = createService();
    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('Database connection closed');
  });

  it('logs and rethrows errors when database disconnection fails on destroy', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const disconnectError = new Error('disconnect failed');
    jest.spyOn(PrismaClient.prototype, '$disconnect').mockRejectedValue(disconnectError);
    const { errorSpy } = mockLogger();

    const service = createService();

    await expect(service.onModuleDestroy()).rejects.toThrow(disconnectError);
    expect(errorSpy).toHaveBeenCalledWith('Error while disconnecting from the database', disconnectError);
  });

  it('delegates array transactions to the base Prisma client and preserves isolation level', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const transactionResult = ['done'];
    const transactionSpy = jest.spyOn(PrismaClient.prototype, '$transaction').mockResolvedValue(transactionResult as unknown);

    const service = createService();
    const promises = [Promise.resolve('value') as unknown as PrismaPromise<string>];
    const result = await service.$transaction(promises, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    expect(transactionSpy).toHaveBeenCalledWith(promises, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(result).toBe(transactionResult);
  });

  it('delegates callback transactions to the base Prisma client', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const transactionResult = { ok: true };
    const callback = jest.fn().mockResolvedValue(transactionResult);
    const transactionSpy = jest
      .spyOn(PrismaClient.prototype, '$transaction')
      .mockImplementation((fnOrRequests: unknown) => {
        if (typeof fnOrRequests === 'function') {
          return fnOrRequests({} as PrismaClient);
        }
        return Promise.resolve(null);
      });

    const service = createService();
    const result = await service.$transaction(callback, { maxWait: 100, timeout: 200 });

    expect(transactionSpy).toHaveBeenCalledWith(callback, { maxWait: 100, timeout: 200 });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(result).toBe(transactionResult);
  });

  it('rejects invalid transaction arguments and does not call the base client', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const transactionSpy = jest.spyOn(PrismaClient.prototype, '$transaction').mockResolvedValue(undefined);

    const service = createService();

    await expect(service.$transaction('invalid' as never)).rejects.toThrow('Invalid argument type for transaction');
    expect(transactionSpy).not.toHaveBeenCalled();
  });

  it('maps known request errors to descriptive messages', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const knownError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    jest.spyOn(PrismaClient.prototype, '$transaction').mockImplementation(() => Promise.reject(knownError));
    const { errorSpy } = mockLogger();

    const service = createService();

    await expect(
      service.$transaction([] as unknown as PrismaPromise<unknown>[], {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }),
    ).rejects.toThrow('A unique constraint was violated');
    expect(errorSpy).toHaveBeenCalledWith(`Prisma Known Request Error (${knownError.code}): ${knownError.message}`, knownError.meta);
  });

  it('maps record-not-found errors to descriptive messages', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const knownError = new Prisma.PrismaClientKnownRequestError('Missing record', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });
    jest.spyOn(PrismaClient.prototype, '$transaction').mockImplementation(() => Promise.reject(knownError));
    const { errorSpy } = mockLogger();

    const service = createService();

    await expect(service.$transaction([] as unknown as PrismaPromise<unknown>[])).rejects.toThrow('Record not found');
    expect(errorSpy).toHaveBeenCalledWith(`Prisma Known Request Error (${knownError.code}): ${knownError.message}`, knownError.meta);
  });

  it('wraps unknown Prisma request errors with a generic message', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const unknownError = new Prisma.PrismaClientUnknownRequestError('Something went wrong', {
      clientVersion: '5.0.0',
    });
    jest.spyOn(PrismaClient.prototype, '$transaction').mockImplementation(() => Promise.reject(unknownError));
    const { errorSpy } = mockLogger();

    const service = createService();

    await expect(service.$transaction([] as unknown as PrismaPromise<unknown>[])).rejects.toThrow(
      'An unknown database error occurred',
    );
    expect(errorSpy).toHaveBeenCalledWith('Prisma Unknown Request Error:', unknownError);
  });

  it('wraps Prisma validation errors with a descriptive message', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const validationError = new Prisma.PrismaClientValidationError('Invalid input', {
      clientVersion: '5.0.0',
    });
    jest.spyOn(PrismaClient.prototype, '$transaction').mockImplementation(() => Promise.reject(validationError));
    const { errorSpy } = mockLogger();

    const service = createService();

    await expect(service.$transaction([] as unknown as PrismaPromise<unknown>[])).rejects.toThrow('Invalid database operation');
    expect(errorSpy).toHaveBeenCalledWith('Prisma Validation Error:', validationError);
  });

  it('wraps Prisma initialization errors with a descriptive message and logs fatally', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const initializationError = new Prisma.PrismaClientInitializationError('Init failed', '5.0.0', 'P5010');
    jest.spyOn(PrismaClient.prototype, '$transaction').mockImplementation(() => Promise.reject(initializationError));
    const { fatalSpy } = mockLogger();

    const service = createService();

    await expect(service.$transaction([] as unknown as PrismaPromise<unknown>[])).rejects.toThrow(
      'Failed to initialize the database connection',
    );
    expect(fatalSpy).toHaveBeenCalledWith('Prisma Initialization Error:', initializationError);
  });

  it('wraps Prisma rust panic errors with a critical message and logs fatally', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const rustPanicError = new Prisma.PrismaClientRustPanicError('Rust panic', '5.0.0');
    jest.spyOn(PrismaClient.prototype, '$transaction').mockImplementation(() => Promise.reject(rustPanicError));
    const { fatalSpy } = mockLogger();

    const service = createService();

    await expect(service.$transaction([] as unknown as PrismaPromise<unknown>[])).rejects.toThrow(
      'A critical database error occurred',
    );
    expect(fatalSpy).toHaveBeenCalledWith('Prisma Rust Panic:', rustPanicError);
  });

  it('re-throws non-Prisma errors unchanged', async () => {
    jest.spyOn(PrismaClient.prototype, '$on').mockImplementation(function (this: PrismaClient) {
      return this;
    });
    const arbitraryError = new Error('non prisma');
    jest.spyOn(PrismaClient.prototype, '$transaction').mockImplementation(() => Promise.reject(arbitraryError));

    const service = createService();

    await expect(service.$transaction([] as unknown as PrismaPromise<unknown>[])).rejects.toThrow(arbitraryError);
  });
});
