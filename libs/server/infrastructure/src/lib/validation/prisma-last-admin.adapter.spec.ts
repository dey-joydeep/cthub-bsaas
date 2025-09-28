import { Test } from '@nestjs/testing';
import { PrismaLastAdminAdapter } from './prisma-last-admin.adapter';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { UserRole } from '@cthub-bsaas/shared';

describe('PrismaLastAdminAdapter', () => {
  let adapter: PrismaLastAdminAdapter;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PrismaLastAdminAdapter,
        {
          provide: PrismaService,
          useValue: {
            userRole: {
              findMany: jest.fn(),
            },
            salonTenantStaff: {
              findFirst: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    adapter = module.get<PrismaLastAdminAdapter>(PrismaLastAdminAdapter);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const userId = 'user-id';
      const roles = [{ role: { name: UserRole.ADMIN } }];
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue(roles);

      const result = await adapter.getUserRoles(userId);

      expect(result).toEqual(roles);
    });
  });

  describe('getActiveStaffRecord', () => {
    it('should return active staff record', async () => {
      const userId = 'user-id';
      const record = { salonId: 'salon-id' };
      (prisma.salonTenantStaff.findFirst as jest.Mock).mockResolvedValue(record);

      const result = await adapter.getActiveStaffRecord(userId);

      expect(result).toEqual(record);
    });
  });

  describe('countOtherActiveAdmins', () => {
    it('should return the count of other active admins', async () => {
      const salonId = 'salon-id';
      const userId = 'user-id';
      const count = 1;
      (prisma.salonTenantStaff.count as jest.Mock).mockResolvedValue(count);

      const result = await adapter.countOtherActiveAdmins(salonId, userId);

      expect(result).toBe(count);
    });
  });
});
