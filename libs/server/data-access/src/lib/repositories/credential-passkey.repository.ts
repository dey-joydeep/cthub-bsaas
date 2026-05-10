import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { ICredentialPasskeyRepository } from '@cthub-bsaas/server-contracts-auth';

@Injectable()
export class CredentialPasskeyRepository implements ICredentialPasskeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasAny(userId: string): Promise<boolean> {
    const count = await this.prisma.credentialPasskey.count({ where: { userId } });
    return count > 0;
  }
}

