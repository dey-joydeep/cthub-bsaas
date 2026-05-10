import { Injectable } from '@nestjs/common';
import type { OAuthStateStore } from './state.store';
import { ConfigService } from '@cthub-bsaas/server-core';
import Redis from 'ioredis';

@Injectable()
export class RedisOAuthStateStore implements OAuthStateStore {
  private client: Redis;

  constructor(private readonly config: ConfigService) {
    const url = (this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379/0').toString();
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }

  async set(state: string, ttlSec: number): Promise<void> {
    await this.client.set(`oauth:state:${state}`, '1', 'EX', ttlSec);
  }

  async consume(state: string): Promise<boolean> {
    // Use LUA script for atomic get+del to avoid relying on Redis version-specific commands
    const lua = `local k=KEYS[1]; local v=redis.call('GET',k); if v then redis.call('DEL',k); end; return v;`;
    const res = await this.client.eval(lua, 1, `oauth:state:${state}`);
    if (typeof res === 'string') return res === '1';
    if (typeof res === 'number') return res === 1;
    if (Buffer.isBuffer(res)) return res.toString('utf8') === '1';
    return false;
  }
}
