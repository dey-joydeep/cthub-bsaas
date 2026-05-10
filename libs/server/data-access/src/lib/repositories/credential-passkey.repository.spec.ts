import { CredentialPasskeyRepository } from './credential-passkey.repository';
import { PrismaService } from '../prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Prisma } from '@prisma/client';

// Match a superset of fields Prisma expects on findMany without select typing
type FullPasskeyRow = {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: Uint8Array<ArrayBufferLike>;
  counter: number;
  createdAt: Date;
  lastUsedAt: Date | null;
  transports: string | null;
};

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

  it('returns count for a user', async () => {
    prisma.credentialPasskey.count.mockResolvedValue(3);
    await expect(repository.countByUser('u-1')).resolves.toBe(3);
    expect(prisma.credentialPasskey.count).toHaveBeenCalledWith({ where: { userId: 'u-1' } });
  });

  it('lists passkeys and maps fields (with transports)', async () => {
    const created = new Date('2025-01-02T03:04:05Z');
    const lastUsed = new Date('2025-02-03T04:05:06Z');
    const rows: FullPasskeyRow[] = [
      {
        id: 'row-1',
        userId: 'u-2',
        credentialId: 'credA',
        publicKey: new Uint8Array(),
        counter: 0,
        createdAt: created,
        lastUsedAt: lastUsed,
        transports: 'internal,hybrid',
      },
    ];
    prisma.credentialPasskey.findMany.mockResolvedValue(rows as unknown as FullPasskeyRow[]);
    const result = await repository.listByUser('u-2');
    expect(prisma.credentialPasskey.findMany).toHaveBeenCalledWith({
      where: { userId: 'u-2' },
      select: { credentialId: true, createdAt: true, lastUsedAt: true, transports: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([
      {
        credentialId: 'credA',
        createdAt: created.toISOString(),
        lastUsedAt: lastUsed.toISOString(),
        transports: ['internal', 'hybrid'],
      },
    ]);
  });

  it('lists passkeys with undefined transports and dates', async () => {
    const rows: FullPasskeyRow[] = [
      {
        id: 'row-2',
        userId: 'u-3',
        credentialId: 'credB',
        publicKey: new Uint8Array(),
        counter: 0,
        createdAt: new Date('2025-03-04T05:06:07Z'),
        lastUsedAt: null,
        transports: null,
      },
    ];
    prisma.credentialPasskey.findMany.mockResolvedValue(rows as unknown as FullPasskeyRow[]);
    const result = await repository.listByUser('u-3');
    expect(result[0]?.transports).toBeUndefined();
    expect(result[0]?.lastUsedAt).toBeUndefined();
  });

  it('deletes passkey for user and returns boolean result', async () => {
    prisma.credentialPasskey.deleteMany.mockResolvedValue({ count: 1 } as Prisma.BatchPayload);
    await expect(repository.deleteForUser('u-4', 'cred-1')).resolves.toBe(true);
    prisma.credentialPasskey.deleteMany.mockResolvedValue({ count: 0 } as Prisma.BatchPayload);
    await expect(repository.deleteForUser('u-4', 'cred-x')).resolves.toBe(false);
  });
});
