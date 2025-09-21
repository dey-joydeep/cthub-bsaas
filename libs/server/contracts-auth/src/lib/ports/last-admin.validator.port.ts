import { UserRole } from '@cthub-bsaas/shared';

export const LAST_ADMIN_VALIDATOR_PORT = Symbol('LAST_ADMIN_VALIDATOR_PORT');

export interface ILastAdminValidatorDb {
  getUserRoles(userId: string): Promise<{ role: { name: UserRole } }[]>;
  getActiveStaffRecord(userId: string): Promise<{ salonId: string } | null>;
  countOtherActiveAdmins(salonId: string, userId: string): Promise<number>;
}
