import { UserRole } from '../enums/user-role.enum';

/**
 * Represents role information with ID and name
 */
export interface UserRoleInfo {
  id: number;
  name: string;
}

/**
 * Represents the authenticated user object available in requests
 */
export interface AuthenticatedUser {
  // Core user information
  id: string;
  email: string;
  name?: string;
  isVerified?: boolean;

  // Role information (support both string and object formats for backward compatibility)
  roles: UserRole[] | UserRoleInfo[];

  // Tenant information
  tenantId?: string;

  // Allow additional properties for flexibility
  [key: string]: unknown;
}
