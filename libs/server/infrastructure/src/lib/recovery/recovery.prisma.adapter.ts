import { Injectable } from '@nestjs/common';
import type { RecoveryCodesPort } from '@cthub-bsaas/server-contracts-auth';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

/**
 * @public
 * Prisma-backed implementation of recovery codes.
 * Stores bcrypt-hashed codes and consumes them atomically.
 */
@Injectable()
export class RecoveryCodesPrismaAdapter implements RecoveryCodesPort {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string, count = 10): Promise<string[]> {
    // Remove existing codes for the user
    await this.prisma.recoveryCode.deleteMany({ where: { userId } });

    const plain: string[] = [];
    const rows: { userId: string; codeHash: string }[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex');
      plain.push(code);
      const codeHash = await bcrypt.hash(code, 10);
      rows.push({ userId, codeHash });
    }
    // Bulk insert
    if (rows.length > 0) {
      await this.prisma.recoveryCode.createMany({ data: rows });
    }
    return plain;
  }

  async verifyAndConsume(userId: string, code: string): Promise<boolean> {
    // Fetch active codes
    const codes = await this.prisma.recoveryCode.findMany({ where: { userId, usedAt: null } });
    for (const rec of codes) {
      const ok = await bcrypt.compare(code, rec.codeHash);
      if (ok) {
        // Mark used (id unique) and stop
        await this.prisma.recoveryCode.update({ where: { id: rec.id }, data: { usedAt: new Date() } });
        return true;
      }
    }
    return false;
  }
}
