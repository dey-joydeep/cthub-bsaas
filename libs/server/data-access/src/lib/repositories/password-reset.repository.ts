import type { IPasswordResetRepository, PasswordResetRecord } from '@cthub-bsaas/server-contracts-auth';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PasswordResetRepository implements IPasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { id: string; userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordResetRecord> {
    const created = await this.prisma.passwordReset.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
    return created as unknown as PasswordResetRecord;
  }

  async findById(id: string): Promise<PasswordResetRecord | null> {
    const rec = await this.prisma.passwordReset.findUnique({ where: { id } });
    return (rec as unknown as PasswordResetRecord) ?? null;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordReset.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
