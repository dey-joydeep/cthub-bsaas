import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AuthenticatedUser, UserRole } from '@cthub-bsaas/shared';
import { RolesGuard, expandUserRolesDownward, normalizeUserRoles } from './roles.guard';
import { Roles, ROLES_KEY } from '../../decorators/roles.decorator';

interface MockContextOptions {
  readonly skipMetadata?: boolean;
}

// Create a mock ExecutionContext with roles metadata stamped on the handler
const createMockExecutionContext = (
  user: Partial<AuthenticatedUser> | null,
  _reflector: Reflector, // kept in signature so call sites don’t change
  requiredRoles: UserRole[] = [],
  options?: MockContextOptions,
): ExecutionContext => {
  const handler = function noop() {};
  const handlerClass = class MockHandler {};
  if (!options?.skipMetadata) {
    Reflect.defineMetadata(ROLES_KEY, requiredRoles, handler);
  }

  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => handler,
    getClass: () => handlerClass,
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access if no roles are required', () => {
      const context = createMockExecutionContext({ roles: [UserRole.CUSTOMER] }, reflector);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when no @Roles metadata is defined', () => {
      const context = createMockExecutionContext({ roles: [UserRole.CUSTOMER] }, reflector, undefined, { skipMetadata: true });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if user is not authenticated', () => {
      const context = createMockExecutionContext(null, reflector, [UserRole.ADMIN]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access if user has no roles', () => {
      const context = createMockExecutionContext({ roles: [] }, reflector, [UserRole.CUSTOMER]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access when user roles are undefined', () => {
      const context = createMockExecutionContext({} as Partial<AuthenticatedUser>, reflector, [UserRole.CUSTOMER]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access for direct role match', () => {
      const context = createMockExecutionContext({ roles: [UserRole.STAFF] }, reflector, [UserRole.STAFF]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access for hierarchical role match (ADMIN checking for CUSTOMER)', () => {
      const context = createMockExecutionContext({ roles: [UserRole.ADMIN] }, reflector, [UserRole.CUSTOMER]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access for insufficient permissions (CUSTOMER vs ADMIN)', () => {
      const context = createMockExecutionContext({ roles: [UserRole.CUSTOMER] }, reflector, [UserRole.ADMIN]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should handle user roles as objects', () => {
      const user = { roles: [{ name: UserRole.OWNER }] } as Partial<AuthenticatedUser>;
      const context = createMockExecutionContext(user, reflector, [UserRole.STAFF]);
      // OWNER implies STAFF
      expect(guard.canActivate(context)).toBe(true);
    });

    it('accepts uppercase role names issued in JWT payloads', () => {
      const context = createMockExecutionContext({ roles: ['OWNER'] as unknown as AuthenticatedUser['roles'] }, reflector, [UserRole.OWNER]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should ignore invalid roles in user object and still grant access if one valid role exists', () => {
      const user = {
        // Intentionally mix invalid strings with one valid role
        roles: ['invalid-role', UserRole.STAFF] as unknown as UserRole[],
      } as Partial<AuthenticatedUser>;
      const context = createMockExecutionContext(user, reflector, [UserRole.STAFF]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access if user has only invalid roles', () => {
      const user = {
        // Only invalid strings; normalization yields no valid roles -> Forbidden
        roles: ['invalid-role', 'another-invalid'] as unknown as UserRole[],
      } as Partial<AuthenticatedUser>;
      const context = createMockExecutionContext(user, reflector, [UserRole.STAFF]);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow access when multiple required roles include one that user effectively has (via hierarchy)', () => {
      const context = createMockExecutionContext({ roles: [UserRole.OWNER] }, reflector, [UserRole.ADMIN, UserRole.STAFF]);
      // OWNER implies STAFF
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should fallback to the raw role value when hierarchy has no mapping', () => {
      const originalValues = Object.values;
      const valuesSpy = jest
        .spyOn(Object, 'values')
        .mockImplementation((target: unknown) => {
          const baseResult = originalValues.call(Object, target as never);
          if (target === UserRole) {
            return [...(baseResult as unknown[]), 'mystery-role'];
          }
          return baseResult as unknown[];
        });

      const mysteriousRole = 'mystery-role' as unknown as UserRole;
      const context = createMockExecutionContext(
        { roles: [mysteriousRole] as unknown as AuthenticatedUser['roles'] },
        reflector,
        [mysteriousRole],
      );

      try {
        expect(guard.canActivate(context)).toBe(true);
      } finally {
        valuesSpy.mockRestore();
      }
    });
  });

  describe('Roles Decorator', () => {
    it('should apply roles to a class', () => {
      @Roles(UserRole.ADMIN)
      class TestClass {}
      const roles = Reflect.getMetadata(ROLES_KEY, TestClass) as UserRole[];
      expect(roles).toEqual([UserRole.ADMIN]);
    });

    it('should apply roles to a method', () => {
      class TestClass {
        @Roles(UserRole.CUSTOMER)
        testMethod() {}
      }
      const roles = Reflect.getMetadata(ROLES_KEY, TestClass.prototype.testMethod) as UserRole[];
      expect(roles).toEqual([UserRole.CUSTOMER]);
    });
  });

  describe('helper exports', () => {
    it('normalizeUserRoles handles undefined inputs', () => {
      expect(normalizeUserRoles(undefined)).toEqual([]);
    });

    it('normalizeUserRoles canonicalizes uppercase role strings', () => {
      expect(normalizeUserRoles(['ADMIN', 'OWNER'] as unknown as AuthenticatedUser['roles'])).toEqual([
        UserRole.ADMIN,
        UserRole.OWNER,
      ]);
    });

    it('expandUserRolesDownward falls back to original role when hierarchy lacks mapping', () => {
      const mysteryRole = 'mystery-role' as UserRole;
      expect(expandUserRolesDownward([mysteryRole])).toEqual([mysteryRole]);
    });
  });
});
