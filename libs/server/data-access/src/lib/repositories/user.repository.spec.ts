import { UserRepository } from './user.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma.service';
import type { Prisma, User, RegistrationStatus } from '@prisma/client';

describe('UserRepository', () => {
  let prisma: DeepMockProxy<PrismaService>;
  let repo: UserRepository;

  const now = () => new Date('2024-01-01T00:00:00.000Z');

  const createUser = (overrides: Partial<User> = {}): User => ({
    id: overrides.id ?? 'u1',
    email: overrides.email ?? 'e@x.com',
    name: overrides.name ?? null,
    passwordHash: overrides.passwordHash ?? 'hash',
    phone: overrides.phone ?? null,
    isVerified: overrides.isVerified ?? true,
    isActive: overrides.isActive ?? true,
    avatarUrl: overrides.avatarUrl ?? null,
    lastLoginAt: overrides.lastLoginAt ?? null,
    createdAt: overrides.createdAt ?? now(),
    updatedAt: overrides.updatedAt ?? now(),
    salonTenantId: overrides.salonTenantId ?? null,
    emailVerifiedAt: overrides.emailVerifiedAt ?? null,
    registrationStatus: overrides.registrationStatus ?? ("COMPLETED" as RegistrationStatus),
    isMFAEnrollRequired: overrides.isMFAEnrollRequired ?? false,
    mfaReminderFirstAt: overrides.mfaReminderFirstAt ?? null,
    mfaReminderLastAt: overrides.mfaReminderLastAt ?? null,
  });

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    repo = new UserRepository(prisma);
  });

  it('finds by id with roles', async () => {
    const found = Object.assign(createUser(), { roles: [] }) as User & { roles: { role: { name: string } }[] };
    prisma.user.findUnique.mockResolvedValue(found as User);
    await expect(repo.findById('u1')).resolves.toEqual(found);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
  });

  it('finds by email with roles', async () => {
    const found = Object.assign(createUser({ email: 'e@example.com' }), { roles: [] }) as User & {
      roles: { role: { name: string } }[];
    };
    prisma.user.findUnique.mockResolvedValue(found as User);
    await expect(repo.findByEmail('e@example.com')).resolves.toEqual(found);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'e@example.com' } }));
  });

  it('finds managed branch ids for manager positions', async () => {
    prisma.salonTenantStaff.findMany.mockResolvedValue([
      { salonId: 'branch-1', position: 'Branch Manager' },
      { salonId: 'branch-2', position: 'manager' },
      { salonId: 'branch-3', position: 'Stylist' },
      { salonId: 'branch-1', position: 'MANAGER' },
    ] as never);

    const result = await repo.findManagedBranchIds('u1');
    expect(result).toEqual(['branch-1', 'branch-2']);
    expect(prisma.salonTenantStaff.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        isActive: true,
      },
      select: {
        salonId: true,
        position: true,
      },
    });
  });

  it('creates', async () => {
    const created = createUser();
    prisma.user.create.mockResolvedValue(created);
    const data: Prisma.UserCreateInput = { email: 'e@x.com', passwordHash: 'x' } as unknown as Prisma.UserCreateInput;
    await expect(repo.create(data)).resolves.toBe(created);
  });

  it('updates', async () => {
    const updated = createUser({ name: 'New' });
    prisma.user.update.mockResolvedValue(updated);
    const data: Prisma.UserUpdateInput = { name: { set: 'New' } };
    await expect(repo.update('u1', data)).resolves.toBe(updated);
  });
});
