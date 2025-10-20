import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ChallengeStore } from './challenge.store';
import { ConfigService, LoggerService } from '@cthub-bsaas/server-core';
import { Optional } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisChallengeStore implements ChallengeStore, OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly url: string;

  constructor(private readonly config: ConfigService, @Optional() private readonly logger?: LoggerService) {
    this.url = (this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379/0').toString();
    this.client = new Redis(this.url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    // Attempt a quick ping with timeout; log warning if unreachable.
    try {
      await this.client.connect();
      const ping = await Promise.race([
        this.client.ping(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
      ]);
      if (ping !== 'PONG') throw new Error('unexpected ping response');
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in (err as Record<string, unknown>)
        ? String((err as { message?: unknown }).message)
        : String(err);
      this.logger?.warn(
        `Redis not reachable at ${this.url}. WebAuthn challenge store may fail until Redis is available. Error: ${msg}`,
        'RedisChallengeStore',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.client.status !== 'end') await this.client.quit();
    } catch {
      // ignore
    }
  }

  async set(key: string, value: string, ttlSec: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSec);
  }

  async consume(key: string): Promise<string | null> {
    // Use LUA script for atomic get+del to avoid relying on Redis version-specific commands
    const lua = `local v = redis.call('GET', KEYS[1]); if v then redis.call('DEL', KEYS[1]); end; return v;`;
    const res = await this.client.eval(lua, 1, key);
    if (typeof res === 'string') return res;
    if (res == null) return null;
    if (typeof res === 'number') return String(res);
    if (Buffer.isBuffer(res)) return res.toString('utf8');
    return null;
  }
}
