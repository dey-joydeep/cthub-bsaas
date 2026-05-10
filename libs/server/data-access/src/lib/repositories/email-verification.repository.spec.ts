import { EmailVerificationRepository } from './email-verification.repository';
import { PrismaService } from '../prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import type { EmailVerification } from '@prisma/client';
import { VerificationPurpose } from '@prisma/client';

describe('EmailVerificationRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repository: EmailVerificationRepository;
  const fixedNow = new Date('2024-01-01T00:00:00.000Z');

  const buildVerification = (overrides: Partial<EmailVerification> = {}): EmailVerification => ({
    id: 'verification-id',
    email: 'user@example.com',
    codeHash: 'hash',
    expiresAt: new Date(fixedNow.getTime() + 60_000),
    attempts: 0,
    usedAt: null,
    createdAt: fixedNow,
    purpose: VerificationPurpose.REGISTRATION,
    sessionId: null,
    meta: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fixedNow);
    prisma = mockDeep<PrismaService>();
    repository = new EmailVerificationRepository(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates an existing email verification record', async () => {
    const existing = buildVerification({
      id: 'id-1',
      codeHash: 'hash-old',
      attempts: 1,
      createdAt: new Date('2023-12-31T00:00:00Z'),
      expiresAt: new Date('2024-01-02T00:00:00Z'),
    });
    prisma.emailVerification.findFirst.mockResolvedValue(existing);
    const updated = { ...existing, codeHash: 'hash-new', attempts: 0, createdAt: fixedNow };
    prisma.emailVerification.update.mockResolvedValue(updated);

    const result = await repository.upsertForEmail(existing.email, 'hash-new', existing.expiresAt);

    expect(prisma.emailVerification.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { codeHash: 'hash-new', expiresAt: existing.expiresAt, attempts: 0, usedAt: null, createdAt: fixedNow },
    });
    expect(result).toEqual(updated);
  });

  it('creates a new email verification record when none exists', async () => {
    prisma.emailVerification.findFirst.mockResolvedValue(null);
    const created = buildVerification({
      id: 'id-2',
      email: 'new@example.com',
      codeHash: 'hash',
      expiresAt: new Date('2024-01-03T00:00:00Z'),
    });
    prisma.emailVerification.create.mockResolvedValue(created);

    const result = await repository.upsertForEmail(created.email, created.codeHash, created.expiresAt);

    expect(prisma.emailVerification.create).toHaveBeenCalledWith({
      data: {
        email: created.email,
        codeHash: created.codeHash,
        expiresAt: created.expiresAt,
        attempts: 0,
        usedAt: null,
        createdAt: fixedNow,
      },
    });
    expect(result).toEqual(created);
  });

  it('finds an active email verification record', async () => {
    const record = buildVerification({
      id: 'id-3',
      email: 'active@example.com',
      expiresAt: new Date('2024-01-02T00:00:00Z'),
    });
    prisma.emailVerification.findFirst.mockResolvedValue(record);

    await expect(repository.findActiveByEmail(record.email)).resolves.toEqual(record);
    expect(prisma.emailVerification.findFirst).toHaveBeenCalledWith({
      where: { email: record.email, usedAt: null, expiresAt: { gt: fixedNow } },
    });
  });

  it('returns null when no active verification exists', async () => {
    prisma.emailVerification.findFirst.mockResolvedValue(null);

    await expect(repository.findActiveByEmail('missing@example.com')).resolves.toBeNull();
  });

  it('marks a verification as used', async () => {
    await repository.markUsed('id-4');

    expect(prisma.emailVerification.update).toHaveBeenCalledWith({
      where: { id: 'id-4' },
      data: { usedAt: expect.any(Date) as Date },
    });
  });

  it('increments verification attempts', async () => {
    await repository.incrementAttempts('id-5');

    expect(prisma.emailVerification.update).toHaveBeenCalledWith({
      where: { id: 'id-5' },
      data: { attempts: { increment: 1 } },
    });
  });
});
