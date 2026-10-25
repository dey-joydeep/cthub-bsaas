import { RedisOAuthStateStore } from './state.store.redis';
import { ConfigService } from '@cthub-bsaas/server-core';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      status: 'ready',
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue('1'),
      quit: jest.fn().mockResolvedValue('OK'),
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
    };
  });
});

describe('RedisOAuthStateStore', () => {
  const cfg = {
    get: (k: string) =>
      ({
        REDIS_URL: 'redis://localhost:6379/0',
      })[k],
  } as unknown as ConfigService;

  it('persists state and consumes via atomic lua', async () => {
    const store = new RedisOAuthStateStore(cfg);
    await expect(store.set('abc', 10)).resolves.toBeUndefined();
    await expect(store.consume('abc')).resolves.toBe(true);
  });

  it('returns false when key missing on consume', async () => {
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      status: 'ready',
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(null),
      quit: jest.fn().mockResolvedValue('OK'),
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
    }));
    const store = new RedisOAuthStateStore(cfg);
    await expect(store.consume('missing')).resolves.toBe(false);
  });

  it('interprets Buffer and number results', async () => {
    // number
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      status: 'ready',
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
    }));
    const s1 = new RedisOAuthStateStore(cfg);
    await expect(s1.consume('k')).resolves.toBe(true);
    // buffer
    (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
      status: 'ready',
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(Buffer.from('1')),
      quit: jest.fn().mockResolvedValue('OK'),
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
    }));
    const s2 = new RedisOAuthStateStore(cfg);
    await expect(s2.consume('k')).resolves.toBe(true);
  });
});
