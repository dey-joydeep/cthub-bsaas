import { Injectable } from '@nestjs/common';
import type { RecoveryCodesPort } from '@cthub-bsaas/server-contracts-auth';
import crypto from 'crypto';

/**
 * @public
 * Simple in-memory implementation of recovery codes.
 */
@Injectable()
export class RecoveryCodesMemoryAdapter implements RecoveryCodesPort {
  private store = new Map<string, Set<string>>();

  /** @inheritdoc */
  async generate(userId: string, count = 10): Promise<string[]> {
    const codes: string[] = [];
    const set = new Set<string>();
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      codes.push(code);
      set.add(code);
    }
    this.store.set(userId, set);
    return codes;
  }

  /** @inheritdoc */
  async verifyAndConsume(userId: string, code: string): Promise<boolean> {
    const set = this.store.get(userId);
    if (!set) return false;
    if (!set.has(code)) return false;
    set.delete(code);
    return true;
  }
}

