import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { ISocialAccountRepository } from '@cthub-bsaas/server-contracts-auth';
import type { SocialAccount } from '@prisma/client';

@Injectable()
export class SocialAccountRepository implements ISocialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProviderAccount(provider: string, providerUserId: string): Promise<SocialAccount | null> {
    return this.prisma.socialAccount.findUnique({ where: { provider_providerUserId: { provider, providerUserId } } });
  }

  async link(userId: string, provider: string, providerUserId: string): Promise<SocialAccount> {
    return this.prisma.socialAccount.create({ data: { userId, provider, providerUserId } });
  }

  async findByUserId(userId: string): Promise<SocialAccount[]> {
    return this.prisma.socialAccount.findMany({ where: { userId } });
  }

  async unlink(userId: string, provider: string): Promise<void> {
    await this.prisma.socialAccount.deleteMany({ where: { userId, provider } });
  }
}

