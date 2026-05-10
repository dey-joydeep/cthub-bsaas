import { Role as PrismaRole } from '@prisma/client';

export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    role: PrismaRole;
    userId: string;
    roleId: number;
  }>;
  saasOwner?: any;
  salonStaff?: any;
  customer?: any;
}
