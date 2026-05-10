import { Role as PrismaRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  roles: Array<{
    role: PrismaRole;
    userId: string;
    roleId: number;
  }>;
  tenantId?: string;
  salonId?: string;
  customerId?: string;
  staffId?: string;
}
