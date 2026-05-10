import { Injectable } from '@nestjs/common';
import type { ChallengeStore } from './challenge.store';

@Injectable()
export class InMemoryChallengeStore implements ChallengeStore {
  private readonly data = new Map<string, { value: string; timeout: NodeJS.Timeout }>();

  set(key: string, value: string, ttlSec: number): Promise<void> {
    this.clearTimer(key);
    const timeout = setTimeout(() => {
      this.data.delete(key);
    }, Math.max(1, Math.floor(ttlSec)) * 1000);
    this.data.set(key, { value, timeout });
    return Promise.resolve();
  }

  consume(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return Promise.resolve(null);
    this.clearTimer(key);
    this.data.delete(key);
    return Promise.resolve(entry.value);
  }

  private clearTimer(key: string): void {
    const existing = this.data.get(key);
    if (existing) clearTimeout(existing.timeout);
  }
}
