import { CredentialTotpRepository } from './credential-totp.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma.service';
import type { CredentialTOTP } from '@prisma/client';

describe('CredentialTotpRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repo: CredentialTotpRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repo = new CredentialTotpRepository(prisma);
  });

  it('finds by userId', async () => {
    const found: CredentialTOTP = {
      /** Unique credential id */ id: 'ct1',
      /** Owner user id */ userId: 'u1',
      /** Encrypted secret bytes */ secretEncrypted: Buffer.from('x'),
      /** Secret version for rotation */ secretVersion: 1,
      /** Verification status */ verified: false,
      /** Creation timestamp */ createdAt: new Date(),
      /** Last successful use */ lastUsedAt: null,
    } as CredentialTOTP;
    prisma.credentialTOTP.findUnique.mockResolvedValue(found);
    await expect(repo.findByUserId('u1')).resolves.toBe(found);
  });

  it('creates', async () => {
    const created: CredentialTOTP = {
      id: 'ct1',
      userId: 'u1',
      secretEncrypted: Buffer.from('x'),
      secretVersion: 1,
      verified: false,
      createdAt: new Date(),
      lastUsedAt: null,
    } as CredentialTOTP;
    prisma.credentialTOTP.create.mockResolvedValue(created);
    const res = await repo.create({ userId: 'u1', secretEncrypted: Buffer.from('x') });
    expect(res).toBe(created);
  });

  it('updates', async () => {
    const updated: CredentialTOTP = {
      id: 'ct1',
      userId: 'u1',
      secretEncrypted: Buffer.from('x'),
      secretVersion: 2,
      verified: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    } as CredentialTOTP;
    prisma.credentialTOTP.update.mockResolvedValue(updated);
    await expect(repo.update('u1', { verified: true })).resolves.toBe(updated);
  });
});
