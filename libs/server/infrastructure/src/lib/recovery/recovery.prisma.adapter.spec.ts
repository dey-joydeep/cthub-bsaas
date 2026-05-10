import { RecoveryCodesPrismaAdapter } from './recovery.prisma.adapter';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import * as bcrypt from 'bcryptjs';
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation((code: string) => Promise.resolve(`HASHED-${code}`)),
  compare: jest.fn().mockImplementation((code: string, hash: string) => Promise.resolve(hash === `HASHED-${code}`)),
}));

describe('RecoveryCodesPrismaAdapter', () => {
  const deleteManyMock = jest.fn().mockResolvedValue({ count: 0 });
  const createManyMock = jest.fn().mockResolvedValue({ count: 0 });
  const findManyMock = jest.fn().mockResolvedValue([]);
  const updateMock = jest.fn().mockResolvedValue({});

  const prisma = {
    recoveryCode: {
      deleteMany: deleteManyMock,
      createMany: createManyMock,
      findMany: findManyMock,
      update: updateMock,
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('generates codes and stores hashed rows', async () => {
    const adapter = new RecoveryCodesPrismaAdapter(prisma);
    const codes = await adapter.generate('u1');
    expect(codes).toHaveLength(10);
    // capture and assert argument shape via mock implementation to avoid unsafe access to mock.calls
    createManyMock.mockImplementationOnce((arg: { data: Array<{ userId: string; codeHash: string }> }) => {
      expect(arg.data).toHaveLength(10);
      expect(arg.data.every((r) => r.userId === 'u1')).toBe(true);
      return Promise.resolve({ count: 0 });
    });
    await adapter.generate('u1');
  });

  it('skips createMany when count is 0', async () => {
    const adapter = new RecoveryCodesPrismaAdapter(prisma);
    const codes = await adapter.generate('u1', 0);
    expect(codes).toEqual([]);
    expect(prisma.recoveryCode.createMany).not.toHaveBeenCalled();
  });

  it('verifies and consumes a matching code', async () => {
    findManyMock.mockResolvedValueOnce([
      { id: 1, userId: 'u1', codeHash: 'HASHED-ok', usedAt: null as Date | null },
      { id: 2, userId: 'u1', codeHash: 'HASHED-no', usedAt: null as Date | null },
    ]);
    const adapter = new RecoveryCodesPrismaAdapter(prisma);
    (bcrypt.compare as unknown as jest.Mock).mockResolvedValueOnce(true);
    const ok = await adapter.verifyAndConsume('u1', 'ok');
    expect(ok).toBe(true);
    expect(prisma.recoveryCode.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { usedAt: expect.any(Date) as unknown as Date },
    });
  });

  it('returns false when no codes match', async () => {
    findManyMock.mockResolvedValueOnce([
      { id: 1, userId: 'u1', codeHash: 'HASHED-x', usedAt: null as Date | null },
    ]);
    const adapter = new RecoveryCodesPrismaAdapter(prisma);
    const ok = await adapter.verifyAndConsume('u1', 'nope');
    expect(ok).toBe(false);
    expect(prisma.recoveryCode.update).not.toHaveBeenCalled();
  });
});
