import { RefreshTokenRepository } from './refresh-token.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma.service';
import type { Prisma, RefreshToken } from '@prisma/client';

describe('RefreshTokenRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repo: RefreshTokenRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repo = new RefreshTokenRepository(prisma);
  });

  it('creates a refresh token', async () => {
    const created: RefreshToken = { jti: 'j1', userId: 'u1', sessionId: 's1', issuedAt: new Date(), revokedAt: null, rotatedFrom: null };
    prisma.refreshToken.create.mockResolvedValue(created);
    const data: Prisma.RefreshTokenUncheckedCreateInput = { jti: 'j1', userId: 'u1', sessionId: 's1' };
    const res = await repo.create(data);
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({ data });
    expect(res).toBe(created);
  });

  it('finds by jti', async () => {
    const found: RefreshToken = { jti: 'j1', userId: 'u1', sessionId: 's1', issuedAt: new Date(), revokedAt: null, rotatedFrom: null };
    prisma.refreshToken.findUnique.mockResolvedValue(found);
    await expect(repo.findByJti('j1')).resolves.toBe(found);
  });

  it('revokes by jti', async () => {
    const updated: RefreshToken = { jti: 'j1', userId: 'u1', sessionId: 's1', issuedAt: new Date(), revokedAt: new Date(), rotatedFrom: null };
    prisma.refreshToken.update.mockResolvedValue(updated);
    await expect(repo.revoke('j1')).resolves.toBe(updated);
  });
});
