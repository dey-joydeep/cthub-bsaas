import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from '@cthub-bsaas/shared';
import { ILastAdminValidatorDb, LAST_ADMIN_VALIDATOR_PORT } from '@cthub-bsaas/server-contracts-auth';

// Local error classes can be removed if a shared error strategy is implemented
export class LastAdminValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'LastAdminValidationError';
  }
}

@ValidatorConstraint({ name: 'isNotLastAdmin', async: true })
@Injectable()
export class IsNotLastAdminConstraint implements ValidatorConstraintInterface {
  private readonly db: ILastAdminValidatorDb;

  /* istanbul ignore next */
  constructor(@Inject(LAST_ADMIN_VALIDATOR_PORT) db: ILastAdminValidatorDb) {
    this.db = db;
  }

  async validate(userId: string, args: ValidationArguments): Promise<boolean> {
    const dto = args.object as { role?: UserRole };
    const roleToSet = dto.role;

    if (!roleToSet || roleToSet === UserRole.ADMIN) {
      return true;
    }

    const userRoles = await this.db.getUserRoles(userId);
    const isAdmin = userRoles.some((roleRecord) => roleRecord.role.name === UserRole.ADMIN);

    if (!isAdmin) {
      return true;
    }

    const activeStaff = await this.db.getActiveStaffRecord(userId);
    if (!activeStaff) {
      return true; // Not an active staff member in any salon
    }

    const { salonId } = activeStaff;
    const otherAdmins = await this.db.countOtherActiveAdmins(salonId, userId);

    if (otherAdmins === 0) {
      throw new LastAdminValidationError('Cannot remove the last admin from a tenant. Please assign another admin first.', {
        userId,
        tenantId: salonId,
      });
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const constraintError = Array.isArray(args.constraints) ? (args.constraints[0] as unknown) : undefined;
    if (constraintError instanceof LastAdminValidationError) {
      return constraintError.message;
    }
    return 'Validation failed while checking admin status';
  }
}