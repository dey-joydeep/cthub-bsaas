import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { ICredentialPasskeyRepository, PasskeyRecord } from '@cthub-bsaas/server-contracts-auth';

@Injectable()
export class CredentialPasskeyRepository implements ICredentialPasskeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasAny(userId: string): Promise<boolean> {
    const count = await this.prisma.credentialPasskey.count({ where: { userId } });
    return count > 0;
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.credentialPasskey.count({ where: { userId } });
  }

  async listByUser(userId: string): Promise<PasskeyRecord[]> {
    const rows = await this.prisma.credentialPasskey.findMany({
      where: { userId },
      select: { credentialId: true, createdAt: true, lastUsedAt: true, transports: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      credentialId: r.credentialId,
      createdAt: r.createdAt?.toISOString(),
      lastUsedAt: r.lastUsedAt?.toISOString(),
      transports: (r.transports ?? undefined)?.split(',').filter(Boolean),
    }));
  }

  async deleteForUser(userId: string, credentialId: string): Promise<boolean> {
    const res = await this.prisma.credentialPasskey.deleteMany({ where: { userId, credentialId } });
    return res.count > 0;
  }
}

