import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import type { IEmailVerificationRepository, EmailVerificationRecord } from '@cthub-bsaas/server-contracts-auth';

@Injectable()
export class EmailVerificationRepository implements IEmailVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForEmail(email: string, codeHash: string, expiresAt: Date): Promise<EmailVerificationRecord> {
    const now = new Date();
    const existing = await this.prisma.emailVerification.findFirst({ where: { email } });
    if (existing) {
      const updated = await this.prisma.emailVerification.update({
        where: { id: existing.id },
        data: { codeHash, expiresAt, attempts: 0, usedAt: null, createdAt: now },
      });
      return updated as unknown as EmailVerificationRecord;
    }
    const created = await this.prisma.emailVerification.create({
      data: { email, codeHash, expiresAt, attempts: 0, usedAt: null, createdAt: now },
    });
    return created as unknown as EmailVerificationRecord;
  }

  async findActiveByEmail(email: string): Promise<EmailVerificationRecord | null> {
    const now = new Date();
    const rec = await this.prisma.emailVerification.findFirst({
      where: { email, usedAt: null, expiresAt: { gt: now } },
    });
    return (rec as unknown as EmailVerificationRecord) ?? null;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerification.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.prisma.emailVerification.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }
}
