import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@cthub-bsaas/shared';

// Local error classes since we can't import them yet
class LastAdminValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'LastAdminValidationError';
  }
}

class DatabaseValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'DatabaseValidationError';
  }
}

@ValidatorConstraint({ name: 'isNotLastAdmin', async: true })
@Injectable()
export class IsNotLastAdminConstraint implements ValidatorConstraintInterface {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async validate(userId: string, args: ValidationArguments): Promise<boolean> {
    try {
      const dto = args.object as { role?: UserRole };
      const roleToSet = dto.role;

      // If not setting a role or not demoting from admin, allow
      if (!roleToSet || roleToSet === UserRole.ADMIN) {
        return true;
      }

      // First, check if the user is an admin
      const userRoles = await this.prisma.userRole.findMany({
        where: {
          userId,
          role: {
            name: UserRole.ADMIN,
          },
        },
      });

      // If user is not an admin, no need to check further
      if (userRoles.length === 0) {
        return true;
      }

      // Get the user's active staff record
      const activeStaff = await this.prisma.salonTenantStaff.findFirst({
        where: {
          userId,
          isActive: true,
        },
        select: {
          salonId: true,
        },
      });

      if (!activeStaff) {
        return true; // Not an active staff member
      }

      const { salonId } = activeStaff;

      // Count other active admin staff in the same salon
      const otherAdmins = await this.prisma.salonTenantStaff.count({
        where: {
          salonId,
          isActive: true,
          userId: { not: userId },
          user: {
            isActive: true,
            roles: {
              some: {
                role: {
                  name: UserRole.ADMIN,
                },
              },
            },
          },
        },
      });

      if (otherAdmins === 0) {
        throw new LastAdminValidationError('Cannot remove the last admin from a tenant. Please assign another admin first.', {
          userId,
          tenantId: salonId,
        });
      }

      return true;
    } catch (error) {
      if (error instanceof LastAdminValidationError) {
        throw error; // Re-throw our custom error
      }

      throw new DatabaseValidationError('Failed to validate last admin status', {
        originalError: error instanceof Error ? error.message : String(error),
        userId,
        operation: 'lastAdminValidation',
      });
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const error = args.constraints?.[0];
    if (error instanceof LastAdminValidationError) {
      return error.message;
    }
    return 'Validation failed while checking admin status';
  }
}

/**
 * Custom decorator to validate that the user is not the last admin in their tenant
 * when attempting to be removed or demoted
 */
export function IsNotLastAdmin(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotLastAdminConstraint,
    });
  };
}
