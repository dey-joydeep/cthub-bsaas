import { SessionRepository } from './session.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma.service';
import type { Prisma, Session } from '@prisma/client';

describe('SessionRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repo: SessionRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repo = new SessionRepository(prisma);
  });

  it('creates a session', async () => {
    const created: Session = { id: 's1', userId: 'u1', createdAt: new Date(), lastSeenAt: new Date(), deviceUA: null, deviceOS: null, ipHash: null };
    prisma.session.create.mockResolvedValue(created);
    const data: Prisma.SessionUncheckedCreateInput = { userId: 'u1' };
    const res = await repo.create(data);
    expect(prisma.session.create).toHaveBeenCalledWith({ data });
    expect(res).toBe(created);
  });

  it('finds by id', async () => {
    const found: Session = { id: 's1', userId: 'u1', createdAt: new Date(), lastSeenAt: new Date(), deviceUA: null, deviceOS: null, ipHash: null };
    prisma.session.findUnique.mockResolvedValue(found);
    await expect(repo.findById('s1')).resolves.toBe(found);
  });

  it('lists by userId', async () => {
    const list: Session[] = [{ id: 's1', userId: 'u1', createdAt: new Date(), lastSeenAt: new Date(), deviceUA: null, deviceOS: null, ipHash: null }];
    prisma.session.findMany.mockResolvedValue(list);
    await expect(repo.findByUserId('u1')).resolves.toBe(list);
  });

  it('updates', async () => {
    const updated: Session = { id: 's1', userId: 'u1', createdAt: new Date(), lastSeenAt: new Date(), deviceUA: null, deviceOS: null, ipHash: null };
    prisma.session.update.mockResolvedValue(updated);
    const data: Prisma.SessionUpdateInput = { lastSeenAt: new Date() } as Prisma.SessionUpdateInput;
    await expect(repo.update('s1', data)).resolves.toBe(updated);
  });

  it('deletes', async () => {
    const deleted: Session = { id: 's1', userId: 'u1', createdAt: new Date(), lastSeenAt: new Date(), deviceUA: null, deviceOS: null, ipHash: null };
    prisma.session.delete.mockResolvedValue(deleted);
    await expect(repo.delete('s1')).resolves.toBe(deleted);
  });
});
