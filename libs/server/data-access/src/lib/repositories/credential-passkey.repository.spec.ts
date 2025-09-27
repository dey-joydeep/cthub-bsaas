import { CredentialPasskeyRepository } from './credential-passkey.repository';
import { PrismaService } from '../prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('CredentialPasskeyRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repository: CredentialPasskeyRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repository = new CredentialPasskeyRepository(prisma);
  });

  it('returns true when at least one passkey exists for the user', async () => {
    prisma.credentialPasskey.count.mockResolvedValue(2);

    await expect(repository.hasAny('user-1')).resolves.toBe(true);
    expect(prisma.credentialPasskey.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });

  it('returns false when no passkeys exist for the user', async () => {
    prisma.credentialPasskey.count.mockResolvedValue(0);

    await expect(repository.hasAny('user-2')).resolves.toBe(false);
  });
});
