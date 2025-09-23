// libs/server/core/src/auth/guards/roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser, UserRole } from '@cthub-bsaas/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role hierarchy: expanding a user's roles "downward" (ADMIN ⇒ OWNER ⇒ STAFF ⇒ CUSTOMER ⇒ GUEST).
 * We DO NOT expand the required roles; we expand the user's roles and then check if any requirement is satisfied.
 */
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.OWNER, UserRole.STAFF, UserRole.CUSTOMER, UserRole.GUEST],
  [UserRole.OWNER]: [UserRole.OWNER, UserRole.STAFF, UserRole.CUSTOMER, UserRole.GUEST],
  [UserRole.STAFF]: [UserRole.STAFF, UserRole.CUSTOMER, UserRole.GUEST],
  [UserRole.CUSTOMER]: [UserRole.CUSTOMER, UserRole.GUEST],
  [UserRole.GUEST]: [UserRole.GUEST],
};

function normalizeUserRoles(roles: AuthenticatedUser['roles'] | undefined): UserRole[] {
  if (!roles) return [];
  return roles
    .map((r) => (typeof r === 'string' ? r : r?.name))
    .filter((r): r is UserRole => !!r && (Object.values(UserRole) as string[]).includes(r));
}

function expandUserRolesDownward(userRoles: UserRole[]): UserRole[] {
  const out = new Set<UserRole>();
  for (const r of userRoles) {
    const implied = ROLE_HIERARCHY[r] ?? [r];
    for (const x of implied) out.add(x);
  }
  return [...out];
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Read required roles (unexpanded)
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) ?? [];

    if (required.length === 0) {
      // No roles required → allow
      return true;
    }

    // Narrow the request typing so we never touch `any`
    const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Expand the user's roles DOWNWARD according to hierarchy
    const expanded = expandUserRolesDownward(normalizeUserRoles(user.roles));
    if (expanded.length === 0) {
      throw new ForbiddenException('User has no roles');
    }

    // Check if any required role is included in the user's expanded set
    const ok = required.some((r) => expanded.includes(r));
    if (!ok) {
      throw new ForbiddenException(`Insufficient permissions. Required roles: ${required.join(', ')}`);
    }
    return true;
  }
}
