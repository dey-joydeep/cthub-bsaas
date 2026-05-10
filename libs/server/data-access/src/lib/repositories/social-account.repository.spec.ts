import { SocialAccountRepository } from './social-account.repository';
import { PrismaService } from '../prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import type { SocialAccount } from '@prisma/client';

describe('SocialAccountRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repository: SocialAccountRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repository = new SocialAccountRepository(prisma);
  });

  it('finds a social account by provider account', async () => {
    const account = {
      id: 1,
      userId: 'user-1',
      provider: 'google',
      providerUserId: 'user-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    } as unknown as SocialAccount;
    prisma.socialAccount.findUnique.mockResolvedValue(account);

    await expect(repository.findByProviderAccount('google', 'user-1')).resolves.toEqual(account);
    expect(prisma.socialAccount.findUnique).toHaveBeenCalledWith({
      where: { provider_providerUserId: { provider: 'google', providerUserId: 'user-1' } },
    });
  });

  it('links a social account', async () => {
    const created = {
      id: 2,
      userId: 'user-2',
      provider: 'apple',
      providerUserId: 'ext-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    } as unknown as SocialAccount;
    prisma.socialAccount.create.mockResolvedValue(created);

    await expect(repository.link('user-2', 'apple', 'ext-1')).resolves.toEqual(created);
    expect(prisma.socialAccount.create).toHaveBeenCalledWith({
      data: { userId: 'user-2', provider: 'apple', providerUserId: 'ext-1' },
    });
  });

  it('lists social accounts for a user', async () => {
    const accounts = [
      {
        id: 3,
        userId: 'user-3',
        provider: 'google',
        providerUserId: 'ext-2',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      },
    ] as unknown as SocialAccount[];
    prisma.socialAccount.findMany.mockResolvedValue(accounts);

    await expect(repository.findByUserId('user-3')).resolves.toEqual(accounts);
    expect(prisma.socialAccount.findMany).toHaveBeenCalledWith({ where: { userId: 'user-3' } });
  });

  it('unlinks accounts for the provider', async () => {
    prisma.socialAccount.deleteMany.mockResolvedValue({ count: 1 });

    await repository.unlink('user-4', 'facebook');

    expect(prisma.socialAccount.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-4', provider: 'facebook' } });
  });
});
