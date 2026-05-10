import { PasswordResetRepository } from './password-reset.repository';
import { PrismaService } from '../prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import type { PasswordReset } from '@prisma/client';

describe('PasswordResetRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repository: PasswordResetRepository;
  const now = new Date('2024-01-01T00:00:00.000Z');
  const expiresAt = new Date('2024-01-02T00:00:00.000Z');

  const buildPasswordReset = (overrides: Partial<PasswordReset> = {}): PasswordReset => ({
    id: 'reset-id',
    userId: 'user-id',
    tokenHash: 'hash',
    expiresAt,
    usedAt: null,
    createdAt: now,
    ...overrides,
  });

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repository = new PasswordResetRepository(prisma);
  });

  it('creates a password reset record', async () => {
    const created = buildPasswordReset({ id: 'reset-1', userId: 'user-1' });
    prisma.passwordReset.create.mockResolvedValue(created);

    const result = await repository.create({ id: 'reset-1', userId: 'user-1', tokenHash: 'hash', expiresAt });

    expect(prisma.passwordReset.create).toHaveBeenCalledWith({
      data: { id: 'reset-1', userId: 'user-1', tokenHash: 'hash', expiresAt },
    });
    expect(result).toEqual(created);
  });

  it('finds a password reset by id', async () => {
    const record = buildPasswordReset({ id: 'reset-2', userId: 'user-2', tokenHash: 'hash-2' });
    prisma.passwordReset.findUnique.mockResolvedValue(record);

    await expect(repository.findById('reset-2')).resolves.toEqual(record);
  });

  it('returns null when a password reset record is not found', async () => {
    prisma.passwordReset.findUnique.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('marks a password reset as used', async () => {
    await repository.markUsed('reset-3');

    expect(prisma.passwordReset.update).toHaveBeenCalledWith({
      where: { id: 'reset-3' },
      data: { usedAt: expect.any(Date) as Date },
    });
  });
});
