import { AppUserRole } from '@cthub-bsaas/shared';

export interface UserWithMinimalInfo {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  tenantId: string | null;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: AppUserRole[];
  tenantId?: string;
  [key: string]: unknown;
}
