import { AppUserRole } from '../../appointment/models/user-params.model';

/**
 * User type for authenticated requests
 * Used with the @User() decorator in controllers
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  roles: Array<{ id: number; name: AppUserRole }>;
  tenantId: string | null;
  isVerified: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
}
