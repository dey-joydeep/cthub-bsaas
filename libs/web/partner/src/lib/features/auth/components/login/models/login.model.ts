import { UserRole } from '@cthub-bsaas/shared';

export interface PartnerAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}
