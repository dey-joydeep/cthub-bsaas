import { RedisRateLimiter } from './rate-limiter.redis';
import { ConfigService } from '@cthub-bsaas/server-core';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map<string, { count: number; ttl: number }>();
    return {
      status: 'ready',
      multi: jest.fn().mockImplementation(() => {
        const ops: Array<() => number> = [];
        const multiObj = {
          incr: (k: string) => {
            ops.push(() => {
              const rec = store.get(k) || { count: 0, ttl: -1 };
              rec.count += 1;
              store.set(k, rec);
              return rec.count;
            });
            return multiObj;
          },
          ttl: (k: string) => {
            ops.push(() => store.get(k)?.ttl ?? -1);
            return multiObj;
          },
          exec: () => Promise.resolve(ops.map((fn) => fn())),
        };
        return multiObj;
      }),
      expire: jest.fn().mockImplementation((k: string, ttl: number) => {
        const rec = store.get(k) || { count: 0, ttl: -1 };
        rec.ttl = ttl;
        store.set(k, rec);
        return Promise.resolve(1);
      }),
    } as unknown as { status: string; multi: jest.Mock; expire: jest.Mock };
  });
});

describe('RedisRateLimiter', () => {
  const cfg = { get: (_: string) => 'redis://localhost:6379/0' } as unknown as ConfigService;

  it('allows under the limit and sets ttl', async () => {
    const rl = new RedisRateLimiter(cfg);
    await rl.checkOrThrow('test:key', 2, 60);
    await rl.checkOrThrow('test:key', 2, 60);
    await expect(rl.checkOrThrow('other:key', 1, 30)).resolves.toBeUndefined();
  });

  it('throws when exceeding the limit with retryAfter (ttl used)', async () => {
    const rl = new RedisRateLimiter(cfg);
    await rl.checkOrThrow('exceed:key', 1, 45);
    await expect(rl.checkOrThrow('exceed:key', 1, 45)).rejects.toMatchObject({ message: 'rate_limit_exceeded', retryAfter: 45 });
  });

  it('uses default REDIS_URL when config missing', async () => {
    const missingCfg = { get: (_: string) => undefined } as unknown as ConfigService;
    const rl = new RedisRateLimiter(missingCfg);
    await expect(rl.checkOrThrow('def:key', 1, 10)).resolves.toBeUndefined();
  });

  it('returns early when count is not a number', async () => {
    type MultiLike = { incr: () => MultiLike; ttl: () => MultiLike; exec: () => Promise<[number | undefined, number]> };
    type ClientLike = { expire: (k: string, ttl: number) => Promise<number>; multi: jest.Mock<MultiLike, []> };
    type RLLike = { client: ClientLike; checkOrThrow: (k: string, limit: number, windowSec: number) => Promise<void> };
    const rl = new RedisRateLimiter(cfg) as unknown as RLLike;
    const expireSpy = jest.spyOn(rl.client, 'expire');
    rl.client.multi = jest.fn(() => ({
      incr: () => rl.client.multi(),
      ttl: () => rl.client.multi(),
      exec: () => Promise.resolve([undefined as unknown as number, -1]),
    })) as unknown as jest.Mock<MultiLike, []>;
    await expect(rl.checkOrThrow('weird:key', 1, 10)).resolves.toBeUndefined();
    expect(expireSpy).not.toHaveBeenCalled();
  });

  it('retryAfter falls back to windowSec when ttl <= 0', async () => {
    const rl = new RedisRateLimiter(cfg);
    await expect(rl.checkOrThrow('immediate:key', 0, 10)).rejects.toMatchObject({ message: 'rate_limit_exceeded', retryAfter: 10 });
  });
});
