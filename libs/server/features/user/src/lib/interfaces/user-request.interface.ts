import { AppUserRole } from '@cthub-bsaas/shared';

/**
 * Represents the authenticated user in the request object
 */
export interface IRequestUser {
  id: string;
  email: string;
  roles: Array<{ name: AppUserRole }>;
  tenantId: string | null;
}

/**
 * Extended Express Request type with user property
 */
declare module 'express' {
  interface Request {
    user: IRequestUser;
  }
}

/**
 * Type for the request with user
 */
export interface IRequestWithUser extends Request {
  user: IRequestUser;
}
