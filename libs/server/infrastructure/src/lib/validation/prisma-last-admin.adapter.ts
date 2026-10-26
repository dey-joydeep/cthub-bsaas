import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cthub-bsaas/server-data-access';
import { ILastAdminValidatorDb } from '@cthub-bsaas/server-contracts-auth';
import { UserRole } from '@cthub-bsaas/shared';

@Injectable()
export class PrismaLastAdminAdapter implements ILastAdminValidatorDb {
  constructor(private readonly prisma: PrismaService) {}

  async getUserRoles(userId: string): Promise<{ role: { name: UserRole } }[]> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId, role: { name: UserRole.ADMIN } },
      select: { role: { select: { name: true } } },
    });

    return roles.map(({ role }): { role: { name: UserRole } } => ({
      role: { name: role.name as UserRole },
    }));
  }

  getActiveStaffRecord(userId: string): Promise<{ salonId: string } | null> {
    return this.prisma.salonTenantStaff.findFirst({
      where: { userId, isActive: true },
      select: { salonId: true },
    });
  }

  countOtherActiveAdmins(salonId: string, userId: string): Promise<number> {
    return this.prisma.salonTenantStaff.count({
      where: {
        salonId,
        isActive: true,
        userId: { not: userId },
        user: {
          isActive: true,
          roles: { some: { role: { name: UserRole.ADMIN } } },
        },
      },
    });
  }
}
