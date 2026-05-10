import { RedisChallengeStore } from './challenge.store.redis';
import { ConfigService, LoggerService } from '@cthub-bsaas/server-core';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map<string, string>();
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      status: 'ready',
      set: jest.fn().mockImplementation((k: string, v: string) => {
        store.set(k, v);
        return Promise.resolve('OK');
      }),
      getdel: jest.fn().mockImplementation((k: string) => {
        const v = store.get(k) ?? null;
        store.delete(k);
        return Promise.resolve(v);
      }),
      eval: jest.fn().mockImplementation((_lua: string, _keys: number, key: string) => {
        const v = store.get(key) ?? null;
        store.delete(key);
        return Promise.resolve(v);
      }),
      quit: jest.fn().mockResolvedValue('OK'),
    };
  });
});

describe('RedisChallengeStore', () => {
  const cfg = { get: (_: string) => 'redis://localhost:6379/0' } as unknown as ConfigService;
  const logger = { warn: jest.fn() } as unknown as LoggerService;

  it('stores and consumes a challenge atomically', async () => {
    const store = new RedisChallengeStore(cfg, logger);
    await store.onModuleInit();
    await store.set('user:reg', 'abc', 60);
    await expect(store.consume('user:reg')).resolves.toBe('abc');
    await expect(store.consume('user:reg')).resolves.toBeNull();
    await store.onModuleDestroy();
  });

  it('logs a warning when ping is not PONG', async () => {
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('BAD'),
      status: 'ready',
      set: jest.fn(),
      eval: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    }));
    const store = new RedisChallengeStore(cfg, logger);
    await store.onModuleInit();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('logs a warning on ping timeout (Promise.race path)', async () => {
    jest.useFakeTimers();
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockReturnValue(new Promise<string>(() => {})),
      status: 'ready',
      set: jest.fn(),
      eval: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    }));
    const store = new RedisChallengeStore(cfg, logger);
    const p = store.onModuleInit();
    await jest.advanceTimersByTimeAsync(1100);
    await p;
    expect(logger.warn).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('logs a warning when connect throws non-Error (no message property)', async () => {
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockRejectedValue(42),
      ping: jest.fn(),
      status: 'ready',
      set: jest.fn(),
      eval: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
    }));
    const store = new RedisChallengeStore(cfg, logger);
    await store.onModuleInit();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('onModuleDestroy skips quit when status is end', async () => {
    const quit = jest.fn().mockResolvedValue('OK');
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      status: 'end',
      set: jest.fn(),
      eval: jest.fn(),
      quit,
    }));
    const store = new RedisChallengeStore(cfg, logger);
    await store.onModuleDestroy();
    expect(quit).not.toHaveBeenCalled();
  });

  it('returns null for unknown eval result types', async () => {
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      status: 'ready',
      set: jest.fn(),
      eval: jest.fn().mockResolvedValue({}),
      quit: jest.fn().mockResolvedValue('OK'),
    }));
    const store = new RedisChallengeStore(cfg, logger);
    await expect(store.consume('k')).resolves.toBeNull();
  });

  it('handles numeric result from eval', async () => {
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      status: 'ready',
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
    }));
    const store = new RedisChallengeStore(cfg, logger);
    await expect(store.consume('k')).resolves.toBe('1');
  });

  it('handles Buffer result from eval', async () => {
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      status: 'ready',
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(Buffer.from('buf')),
      quit: jest.fn().mockResolvedValue('OK'),
    }));
    const store = new RedisChallengeStore(cfg, logger);
    await expect(store.consume('k')).resolves.toBe('buf');
  });
});
