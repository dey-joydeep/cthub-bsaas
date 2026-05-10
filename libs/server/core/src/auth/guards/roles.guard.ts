import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { UserRole } from '@cthub-bsaas/shared';
import { AuthenticatedUser, UserRoleInfo } from '@cthub-bsaas/shared';

export const ROLES_KEY = 'roles';

/**
 * Role hierarchy definition
 * Each role inherits permissions from roles to its right
 */
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [UserRole.OWNER, UserRole.STAFF, UserRole.CUSTOMER],
  [UserRole.OWNER]: [UserRole.STAFF, UserRole.CUSTOMER],
  [UserRole.STAFF]: [UserRole.CUSTOMER],
  [UserRole.CUSTOMER]: [],
  [UserRole.GUEST]: [],
};

// Using AuthenticatedUser from @cthub-bsaas/shared instead of local UserWithRoles

/**
 * Custom decorator to set required roles for a route handler or controller
 * @param roles Array of UserRole that are allowed to access the route
 */
export const Roles = (...roles: UserRole[]) => {
  return (target: object, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value as object);
      return descriptor;
    }
    // Class decorator
    Reflect.defineMetadata(ROLES_KEY, roles, target as object);
    return undefined;
  };
};

@Injectable()
export class RolesGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Checks if a user has at least one of the required roles
   * @param userRoles - Array of user's roles
   * @param requiredRoles - Array of required roles
   */
  private hasRequiredRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
    return userRoles.some((userRole) => {
      // Check direct match
      if (requiredRoles.includes(userRole)) {
        return true;
      }

      // Check role hierarchy
      return ROLE_HIERARCHY[userRole]?.some((higherRole) => requiredRoles.includes(higherRole)) || false;
    });
  }

  override canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract role names from user roles, handling both string and object formats
    const userRoleNames = (user.roles || [])
      .map((role) => {
        if (typeof role === 'string') {
          return role as UserRole;
        }
        return (role as UserRoleInfo).name;
      })
      .filter((role): role is UserRole => role !== undefined && Object.values<string>(UserRole).includes(role));

    // Check if user has any of the required roles
    if (userRoleNames.length === 0 || !this.hasRequiredRole(userRoleNames, requiredRoles)) {
      throw new ForbiddenException(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
