import { UserRepository } from './user.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma.service';
import type { Prisma, User } from '@prisma/client';

describe('UserRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repo: UserRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repo = new UserRepository(prisma);
  });

  it('finds by id with roles', async () => {
    const found = { id: 'u1', email: 'e@x.com', name: null, passwordHash: 'x', phone: null, isVerified: true, isActive: true, avatarUrl: null, lastLoginAt: null, createdAt: new Date(), updatedAt: new Date(), salonTenantId: null, emailVerifiedAt: null, roles: [] } as unknown as User & { roles: { role: { name: string } }[] };
    prisma.user.findUnique.mockResolvedValue(found as unknown as User);
    await expect(repo.findById('u1')).resolves.toEqual(found);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
  });

  it('finds by email with roles', async () => {
    const found = { id: 'u1', email: 'e@example.com', name: null, passwordHash: 'x', phone: null, isVerified: true, isActive: true, avatarUrl: null, lastLoginAt: null, createdAt: new Date(), updatedAt: new Date(), salonTenantId: null, emailVerifiedAt: null, roles: [] } as unknown as User & { roles: { role: { name: string } }[] };
    prisma.user.findUnique.mockResolvedValue(found as unknown as User);
    await expect(repo.findByEmail('e@example.com')).resolves.toEqual(found);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'e@example.com' } }));
  });

  it('creates', async () => {
    const created: User = { id: 'u1', email: 'e@x.com', name: null, passwordHash: 'x', phone: null, isVerified: true, isActive: true, avatarUrl: null, lastLoginAt: null, createdAt: new Date(), updatedAt: new Date(), salonTenantId: null, emailVerifiedAt: null };
    prisma.user.create.mockResolvedValue(created);
    const data: Prisma.UserCreateInput = { email: 'e@x.com', passwordHash: 'x' } as unknown as Prisma.UserCreateInput;
    await expect(repo.create(data)).resolves.toBe(created);
  });

  it('updates', async () => {
    const updated: User = { id: 'u1', email: 'e@x.com', name: null, passwordHash: 'x', phone: null, isVerified: true, isActive: true, avatarUrl: null, lastLoginAt: null, createdAt: new Date(), updatedAt: new Date(), salonTenantId: null, emailVerifiedAt: null };
    prisma.user.update.mockResolvedValue(updated);
    const data: Prisma.UserUpdateInput = { name: { set: 'New' } };
    await expect(repo.update('u1', data)).resolves.toBe(updated);
  });
});
